import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { post_id, org_id, date, platform, content_type } = await request.json();
    console.log("[regenerate-post-idea] Request:", { post_id, org_id, date, platform, content_type });

    if (!post_id || !org_id) {
      return NextResponse.json({ error: "post_id and org_id required" }, { status: 400 });
    }

    // Fetch brand profile
    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("org_id", org_id)
      .single();

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found. Complete Brand Profile setup first." }, { status: 404 });
    }

    // Fetch existing post
    const { data: existingPost } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("id", post_id)
      .single();

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch recent topics to avoid repetition
    const { data: recentPosts } = await supabase
      .from("content_calendar")
      .select("topic")
      .eq("org_id", org_id)
      .not("topic", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    const recentTopics = (recentPosts || []).map((p) => p.topic).filter(Boolean);

    const brandProfileSummary = {
      business_name: brandProfile.business_name,
      industry: brandProfile.industry,
      brand_voice: brandProfile.brand_voice,
      tone_of_voice: brandProfile.tone_of_voice,
      brand_personality: brandProfile.brand_personality,
      content_pillars: brandProfile.content_pillars,
      target_audience: brandProfile.target_audience,
      unique_selling_points: brandProfile.unique_selling_points,
    };

    const prompt = `You are a social media content strategist for this organization.
Generate a FRESH and DIFFERENT post idea for this specific date and platform.

Brand Profile: ${JSON.stringify(brandProfileSummary)}
Date: ${date || existingPost.date}
Platform: ${platform || existingPost.platform}
Content Type: ${content_type || existingPost.content_type}
Current Topic (must be COMPLETELY different from this): ${existingPost.topic}

Also avoid these recent topics: ${JSON.stringify(recentTopics)}

Consider:
- Any festivals, holidays, or awareness days on this date
- The brand's content pillars
- What would perform well on ${platform || existingPost.platform} on this date
- Create something engaging, timely, and aligned with the brand voice

Return as JSON only (no markdown, no code blocks):
{
  "topic": "string - a clear, specific post topic",
  "caption_direction": "string - brief direction for the caption writer",
  "visual_direction": "string - brief direction for the image/visual",
  "occasion": "string or null - any relevant festival, holiday, or awareness day"
}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    console.log("[regenerate-post-idea] Calling Gemini API...");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errData = await geminiResponse.json();
      console.error("[regenerate-post-idea] Gemini error:", errData);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    // Clean response
    text = text.trim();
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();

    console.log("[regenerate-post-idea] Raw response:", text);

    const newIdea = JSON.parse(text);

    // Validate we got the required fields
    if (!newIdea.topic) {
      return NextResponse.json({ error: "AI did not return a valid topic" }, { status: 500 });
    }

    // Update the post in Supabase
    const updatePayload = {
      topic: newIdea.topic,
      caption_direction: newIdea.caption_direction || "",
      visual_direction: newIdea.visual_direction || "",
      occasion: newIdea.occasion || null,
      is_edited_by_user: true,
    };

    const { data: updatedPost, error: updateError } = await supabase
      .from("content_calendar")
      .update(updatePayload)
      .eq("id", post_id)
      .select()
      .single();

    if (updateError) {
      console.error("[regenerate-post-idea] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save new post idea" }, { status: 500 });
    }

    console.log("[regenerate-post-idea] ✓ Post idea regenerated:", newIdea.topic);

    return NextResponse.json({
      success: true,
      topic: newIdea.topic,
      caption_direction: newIdea.caption_direction || "",
      visual_direction: newIdea.visual_direction || "",
      occasion: newIdea.occasion || null,
      post: updatedPost,
    });
  } catch (error) {
    console.error("[regenerate-post-idea] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
