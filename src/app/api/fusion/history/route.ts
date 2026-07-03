// =============================================================================
// API Route — GET /api/fusion/history
// Lists past fusion sessions for the authenticated user's org.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TaskType } from '@/lib/ai-panel/types';
import { VALID_TASK_TYPES } from '@/lib/ai-panel/types';

export async function GET(request: NextRequest) {
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

    // 2. Fetch org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 },
      );
    }

    const orgId = org.id as string;

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const taskTypeFilter = searchParams.get('taskType');

    // 4. Build sessions query
    let sessionsQuery = supabase
      .from('ai_panel_sessions')
      .select(
        'id, task_type, status, input_prompt, final_output, total_cost_usd, total_tokens_used, duration_ms, started_at, completed_at',
      )
      .eq('org_id', orgId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (
      taskTypeFilter &&
      VALID_TASK_TYPES.includes(taskTypeFilter as TaskType)
    ) {
      sessionsQuery = sessionsQuery.eq('task_type', taskTypeFilter);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${sessionsError.message}` },
        { status: 500 },
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // 5. Fetch matching history rows
    const sessionIds = sessions.map((s) => s.id as string);
    const { data: historyRows } = await supabase
      .from('ai_panel_history')
      .select('session_id, winner_worker, worker_scores, user_approved')
      .in('session_id', sessionIds);

    // 6. Merge sessions with history
    const historyBySession = new Map(
      (historyRows ?? []).map((h) => [h.session_id as string, h]),
    );

    const history = sessions.map((s) => {
      const h = historyBySession.get(s.id as string);
      return {
        ...s,
        winner_worker: h?.winner_worker ?? null,
        worker_scores: h?.worker_scores ?? null,
        user_approved: h?.user_approved ?? null,
      };
    });

    return NextResponse.json({ history });
  } catch (err) {
    console.error('[API /fusion/history] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
