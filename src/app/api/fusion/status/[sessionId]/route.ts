// =============================================================================
// API Route — GET /api/fusion/status/[sessionId]
// Polling fallback for live session status + worker votes.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

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

    // 2. Fetch session — scoped to current user
    const { data: session, error: sessionError } = await supabase
      .from('ai_panel_sessions')
      .select(
        'id, status, task_type, input_prompt, started_at, completed_at, final_output, final_output_metadata, duration_ms, total_cost_usd, total_tokens_used',
      )
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    // 3. Fetch votes for this session
    const { data: votes, error: votesError } = await supabase
      .from('ai_panel_votes')
      .select(
        'id, worker_name, blind_label, worker_status, worker_output, worker_cost_usd, worker_latency_ms, claude_score, claude_feedback, used_in_fusion',
      )
      .eq('session_id', sessionId)
      .order('blind_label', { ascending: true });

    if (votesError) {
      console.error('[API /fusion/status] Votes query error:', votesError.message);
    }

    return NextResponse.json({
      session,
      votes: votes ?? [],
    });
  } catch (err) {
    console.error('[API /fusion/status] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
