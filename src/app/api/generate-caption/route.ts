// =============================================================================
// API Route — POST /api/generate-caption
// Fetches brand context, kicks off AI Fusion, and updates the calendar item
// on completion. Returns { sessionId } immediately for live ticker UI.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runFusion } from '@/lib/ai-panel';
import type { SessionStatus } from '@/lib/ai-panel/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // 2. Parse body
    const { calendar_item_id, org_id } = await request.json();

    if (!calendar_item_id || !org_id) {
      return NextResponse.json(
        { error: 'calendar_item_id and org_id required' },
        { status: 400 },
      );
    }

    // 3. Fetch brand profile
    const { data: brandProfile } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('org_id', org_id)
      .single();

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 },
      );
    }

    // 4. Fetch calendar item
    const { data: calendarItem } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('id', calendar_item_id)
      .single();

    if (!calendarItem) {
      return NextResponse.json(
        { error: 'Calendar item not found' },
        { status: 404 },
      );
    }

    // 5. Fetch last 5 captions to avoid repetition
    const { data: recentCaptions } = await supabase
      .from('content_calendar')
      .select('generated_caption')
      .eq('org_id', org_id)
      .not('generated_caption', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentCaptionTexts = (recentCaptions || [])
      .map((c) => c.generated_caption)
      .filter(Boolean);

    // 6. Build the rich prompt with all brand context
    const userPrompt = `Based on the following brand profile and post details,
write a social media caption. Follow these rules strictly:

Brand Voice: ${brandProfile.brand_voice}
Tone: ${brandProfile.tone_of_voice}
Platform: ${calendarItem.platform}
Topic: ${calendarItem.topic}
Content Type: ${calendarItem.content_type}
Caption Direction: ${calendarItem.caption_direction || 'No specific direction'}
Occasion: ${calendarItem.occasion || 'None'}
Industry: ${brandProfile.industry}

Rules:
- Match the brand's exact tone of voice
- Platform-appropriate length (Instagram: 150-300 words, Facebook: 100-200 words, YouTube: 200-400 words for description)
- Include a strong hook in the first line
- Include a clear CTA at the end
- Add relevant hashtags (use brand's suggested hashtags + topic-specific ones)
- Do NOT copy or closely resemble these recent captions: ${JSON.stringify(recentCaptionTexts)}
- Write in the brand's language and style from profile
- Brand personality traits: ${JSON.stringify(brandProfile.brand_personality)}
- Content pillars: ${JSON.stringify(brandProfile.content_pillars)}

Return as JSON (no markdown, no code blocks):
{
  "caption": "full caption text",
  "hashtags": ["hashtag1", "hashtag2"],
  "cta": "call to action text",
  "hook": "hook/first line text",
  "estimated_reach": "low" | "medium" | "high"
}`;

    // 7. Create session row immediately to get sessionId
    const { data: session, error: sessionError } = await supabase
      .from('ai_panel_sessions')
      .insert({
        org_id: org_id,
        user_id: user.id,
        task_type: 'caption' as const,
        input_prompt: userPrompt.slice(0, 2000), // Trim for storage
        input_context: {
          calendar_item_id,
          platform: calendarItem.platform,
          topic: calendarItem.topic,
          content_type: calendarItem.content_type,
        },
        status: 'pending' as SessionStatus,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: `Failed to create session: ${sessionError?.message ?? 'No data returned'}` },
        { status: 500 },
      );
    }

    const sessionId = session.id as string;

    // 8. Fire-and-forget: run fusion, then update calendar item on completion
    runFusion(
      supabase,
      org_id,
      user.id,
      'caption',
      userPrompt,
      {
        calendar_item_id,
        platform: calendarItem.platform,
        topic: calendarItem.topic,
        content_type: calendarItem.content_type,
        brand_voice: brandProfile.brand_voice,
        tone: brandProfile.tone_of_voice,
        industry: brandProfile.industry,
      },
      undefined, // no system prompt override
      sessionId,
    )
      .then(async (result) => {
        // Parse the fused output as JSON and update the calendar item
        try {
          let text = result.finalOutput.trim();
          if (text.startsWith('```json')) text = text.slice(7);
          if (text.startsWith('```')) text = text.slice(3);
          if (text.endsWith('```')) text = text.slice(0, -3);
          text = text.trim();

          const captionData = JSON.parse(text);

          await supabase
            .from('content_calendar')
            .update({
              generated_caption: captionData.caption,
              generated_hashtags: captionData.hashtags || [],
              status: 'caption_generated',
            })
            .eq('id', calendar_item_id);

          // Store parsed metadata on the session for the UI to read
          await supabase
            .from('ai_panel_sessions')
            .update({
              final_output_metadata: {
                winner_worker: result.winnerWorker,
                caption: captionData.caption,
                hashtags: captionData.hashtags || [],
                cta: captionData.cta || '',
                hook: captionData.hook || '',
                estimated_reach: captionData.estimated_reach || 'medium',
                calendar_item_id,
              },
            })
            .eq('id', sessionId);

          console.log('[Caption Fusion] Calendar item updated successfully:', calendar_item_id);
        } catch (parseErr) {
          // If JSON parsing fails, store raw output as caption
          console.warn('[Caption Fusion] Failed to parse JSON output, storing raw:', parseErr);
          await supabase
            .from('content_calendar')
            .update({
              generated_caption: result.finalOutput,
              status: 'caption_generated',
            })
            .eq('id', calendar_item_id);
        }
      })
      .catch((err) => {
        console.error('[Caption Fusion] Background execution failed:', err);
      });

    // 9. Return sessionId immediately
    return NextResponse.json({ sessionId }, { status: 202 });
  } catch (error) {
    console.error('[API /generate-caption] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
