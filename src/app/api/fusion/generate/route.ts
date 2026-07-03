// =============================================================================
// API Route — POST /api/fusion/generate
// Kicks off AI Fusion and returns sessionId immediately (fire-and-forget).
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runFusion } from '@/lib/ai-panel';
import type { TaskType, SessionStatus } from '@/lib/ai-panel/types';
import { VALID_TASK_TYPES } from '@/lib/ai-panel/types';

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
    const body = await request.json();
    const {
      taskType,
      userPrompt,
      context,
      systemPromptOverride,
    } = body as {
      taskType: string;
      userPrompt: string;
      context?: Record<string, unknown>;
      systemPromptOverride?: string;
    };

    // 3. Validate taskType
    if (
      !taskType ||
      !VALID_TASK_TYPES.includes(taskType as TaskType)
    ) {
      return NextResponse.json(
        {
          error: `Invalid taskType. Must be one of: ${VALID_TASK_TYPES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // 4. Validate userPrompt
    if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'userPrompt is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    // 5. Fetch org_id
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'No organization found for this user' },
        { status: 404 },
      );
    }

    const orgId = org.id as string;
    const validTaskType = taskType as TaskType;

    // 6. Create session row immediately to get a sessionId
    const { data: session, error: sessionError } = await supabase
      .from('ai_panel_sessions')
      .insert({
        org_id: orgId,
        user_id: user.id,
        task_type: validTaskType,
        input_prompt: userPrompt.trim(),
        input_context: context ?? null,
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

    // 7. Fire-and-forget: start fusion in the background
    // Pass existingSessionId so RoundManager skips internal session creation.
    runFusion(
      supabase,
      orgId,
      user.id,
      validTaskType,
      userPrompt.trim(),
      context,
      systemPromptOverride,
      sessionId,
    ).catch((err) => {
      console.error('[Fusion] Background execution failed:', err);
    });

    // 8. Return sessionId immediately
    return NextResponse.json({ sessionId }, { status: 202 });
  } catch (err) {
    console.error('[API /fusion/generate] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
