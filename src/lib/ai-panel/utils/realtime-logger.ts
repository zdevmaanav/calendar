// =============================================================================
// AI Panel — Realtime Logger (Supabase status updates)
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdapterResponse,
  BlindLabel,
  JudgeScore,
  SessionStatus,
  WorkerName,
  WorkerStatus,
} from '../types';

/**
 * Writes session / vote updates to Supabase in real-time so the UI can
 * subscribe and show a live status ticker (e.g. "Writing… Judging… Fusing…").
 *
 * **Important:** This class intentionally swallows DB errors — the fusion
 * pipeline must survive database hiccups. Errors are logged to `console.error`.
 */
export class RealtimeLogger {
  private supabase: SupabaseClient;
  private sessionId: string;

  constructor(supabase: SupabaseClient, sessionId: string) {
    this.supabase = supabase;
    this.sessionId = sessionId;
  }

  // ---------------------------------------------------------------------------
  // Session-level updates
  // ---------------------------------------------------------------------------

  /**
   * Update the session's lifecycle status (e.g. round_1_generating → round_2_judging).
   */
  async updateSessionStatus(status: SessionStatus): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_panel_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', this.sessionId);
      if (error) console.error('[RealtimeLogger] updateSessionStatus:', error.message);
    } catch (err) {
      console.error('[RealtimeLogger] updateSessionStatus threw:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Vote (worker) record management
  // ---------------------------------------------------------------------------

  /**
   * Insert a new vote row for a worker with status `pending`.
   *
   * @returns The vote row ID, or `''` if the insert failed.
   */
  async createVoteRecord(workerName: WorkerName, blindLabel: BlindLabel): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('ai_panel_votes')
        .insert({
          session_id: this.sessionId,
          worker_name: workerName,
          blind_label: blindLabel,
          worker_status: 'pending' as WorkerStatus,
        })
        .select('id')
        .single();
      if (error) {
        console.error('[RealtimeLogger] createVoteRecord:', error.message);
        return '';
      }
      return (data as { id: string }).id;
    } catch (err) {
      console.error('[RealtimeLogger] createVoteRecord threw:', err);
      return '';
    }
  }

  /**
   * Update a vote row's worker status (e.g. pending → writing → completed).
   */
  async updateVoteStatus(voteId: string, status: WorkerStatus): Promise<void> {
    if (!voteId) return;
    try {
      const { error } = await this.supabase
        .from('ai_panel_votes')
        .update({ worker_status: status })
        .eq('id', voteId);
      if (error) console.error('[RealtimeLogger] updateVoteStatus:', error.message);
    } catch (err) {
      console.error('[RealtimeLogger] updateVoteStatus threw:', err);
    }
  }

  /**
   * Record a successful worker output — tokens, cost, latency, content.
   */
  async recordWorkerOutput(voteId: string, response: AdapterResponse): Promise<void> {
    if (!voteId) return;
    try {
      const { error } = await this.supabase
        .from('ai_panel_votes')
        .update({
          worker_output: response.content,
          worker_tokens_input: response.tokensInput,
          worker_tokens_output: response.tokensOutput,
          worker_cost_usd: response.costUsd,
          worker_latency_ms: response.latencyMs,
          worker_status: 'completed' as WorkerStatus,
        })
        .eq('id', voteId);
      if (error) console.error('[RealtimeLogger] recordWorkerOutput:', error.message);
    } catch (err) {
      console.error('[RealtimeLogger] recordWorkerOutput threw:', err);
    }
  }

  /**
   * Record a worker failure.
   */
  async recordWorkerError(voteId: string, errorMsg: string): Promise<void> {
    if (!voteId) return;
    try {
      const { error } = await this.supabase
        .from('ai_panel_votes')
        .update({
          worker_error: errorMsg,
          worker_status: 'failed' as WorkerStatus,
        })
        .eq('id', voteId);
      if (error) console.error('[RealtimeLogger] recordWorkerError:', error.message);
    } catch (err) {
      console.error('[RealtimeLogger] recordWorkerError threw:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Judge scores
  // ---------------------------------------------------------------------------

  /**
   * Write Claude's judging scores back to the corresponding vote rows.
   *
   * @param voteIdByLabel - Map from BlindLabel to vote row ID.
   * @param scores        - Array of JudgeScore objects from the scorer.
   */
  async recordJudgeScores(
    voteIdByLabel: Map<BlindLabel, string>,
    scores: JudgeScore[],
  ): Promise<void> {
    for (const score of scores) {
      const voteId = voteIdByLabel.get(score.blindLabel);
      if (!voteId) continue;
      try {
        const { error } = await this.supabase
          .from('ai_panel_votes')
          .update({
            claude_score: score.score,
            claude_feedback: score.feedback,
            claude_best_parts: score.bestParts,
          })
          .eq('id', voteId);
        if (error) console.error('[RealtimeLogger] recordJudgeScores:', error.message);
      } catch (err) {
        console.error('[RealtimeLogger] recordJudgeScores threw:', err);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Session finalisation
  // ---------------------------------------------------------------------------

  /**
   * Mark the session as completed with final results.
   */
  async finalizeSession(
    finalOutput: string,
    winnerWorker: WorkerName,
    totalCostUsd: number,
    totalTokens: number,
    durationMs: number,
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_panel_sessions')
        .update({
          final_output: finalOutput,
          final_output_metadata: { winner_worker: winnerWorker },
          status: 'completed' as SessionStatus,
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          total_cost_usd: totalCostUsd,
          total_tokens_used: totalTokens,
        })
        .eq('id', this.sessionId);
      if (error) console.error('[RealtimeLogger] finalizeSession:', error.message);
    } catch (err) {
      console.error('[RealtimeLogger] finalizeSession threw:', err);
    }
  }

  /**
   * Mark the session as failed.
   */
  async markSessionFailed(errorReason: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_panel_sessions')
        .update({
          status: 'failed' as SessionStatus,
          final_output_metadata: { error: errorReason },
          completed_at: new Date().toISOString(),
        })
        .eq('id', this.sessionId);
      if (error) console.error('[RealtimeLogger] markSessionFailed:', error.message);
    } catch (err) {
      console.error('[RealtimeLogger] markSessionFailed threw:', err);
    }
  }
}
