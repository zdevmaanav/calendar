// =============================================================================
// AI Panel — Round Manager (Full 3-Round Fusion Lifecycle)
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdapterRequest,
  BlindLabel,
  FusionResult,
  JudgeScore,
  SessionStatus,
  TaskType,
  WorkerName,
  WorkerOutput,
} from './types';
import { CLAUDE_MANAGER_MODEL, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from './config';
import { ClaudeAdapter } from './adapters/claude-adapter';
import { Orchestrator } from './orchestrator';
import { Scorer } from './scorer';
import { Synthesizer } from './synthesizer';
import { RealtimeLogger } from './utils/realtime-logger';

// ---------------------------------------------------------------------------
// Default settings for new organisations
// ---------------------------------------------------------------------------

/** Default worker configuration when no settings row exists. */
const DEFAULT_WORKERS_ENABLED: Record<WorkerName, boolean> = {
  gemini: true,
  gpt4o: true,
  llama: true,
  mistral: true,
  kimi: true,
};

/** Default task types that have fusion enabled. */
const DEFAULT_FUSION_ENABLED_FOR: TaskType[] = [
  'brand_profile',
  'content_calendar',
  'caption',
  'image_prompt',
  'video_prompt',
  'ai_suggestion',
  'post_regeneration',
  'scraping_analysis',
];

// ---------------------------------------------------------------------------
// Internal Interfaces
// ---------------------------------------------------------------------------

/** Shape of the ai_panel_settings row. */
interface OrgSettings {
  org_id: string;
  workers_enabled: Record<WorkerName, boolean>;
  fusion_enabled_for: TaskType[];
  monthly_budget_usd: number;
  current_month_spend_usd: number;
}

// ---------------------------------------------------------------------------
// Round Manager
// ---------------------------------------------------------------------------

/**
 * Coordinates the full AI Fusion lifecycle across three rounds:
 *
 * 1. **Round 1** — All enabled workers generate outputs in parallel.
 * 2. **Round 2** — Claude blind-judges outputs with names stripped.
 * 3. **Round 3** — Claude fuses the best parts into a single superior output.
 *
 * Writes real-time status updates to Supabase so the UI can show a live
 * progress ticker (e.g. "Writing… Judging… Fusing…").
 */
export class RoundManager {
  private supabase: SupabaseClient;
  private orgId: string;
  private userId: string;

  constructor(supabase: SupabaseClient, orgId: string, userId: string) {
    this.supabase = supabase;
    this.orgId = orgId;
    this.userId = userId;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Execute the full 3-round AI Fusion pipeline.
   *
   * @param taskType            - The type of task (e.g. 'caption', 'content_calendar').
   * @param userPrompt          - The user's original prompt.
   * @param context             - Optional additional context for the adapters.
   * @param systemPromptOverride - Optional system prompt override for all workers.
   * @param existingSessionId   - Optional pre-created session ID. If provided,
   *                              skips internal session creation (avoids duplicates
   *                              when the API route pre-creates the row for immediate return).
   * @returns The final {@link FusionResult} with fused output, scores, and cost data.
   * @throws If fusion is disabled for this task type, no workers are enabled,
   *         or an unrecoverable error occurs after fallback attempts.
   */
  async runFusion(
    taskType: TaskType,
    userPrompt: string,
    context?: Record<string, unknown>,
    systemPromptOverride?: string,
    existingSessionId?: string,
  ): Promise<FusionResult> {
    const startedAt = Date.now();

    // 1. Load org settings
    const settings = await this.loadOrCreateSettings();

    // 2. Check fusion is enabled for this task type
    if (!settings.fusion_enabled_for.includes(taskType)) {
      throw new Error(`Fusion disabled for task type: ${taskType}`);
    }

    // 3. Use existing session or create a new one
    const sessionId = existingSessionId ?? await this.createSession(taskType, userPrompt, context);

    // 4. Instantiate helpers
    const logger = new RealtimeLogger(this.supabase, sessionId);
    const claudeAdapter = this.createClaudeAdapter();
    const orchestrator = new Orchestrator(settings.workers_enabled);

    // 5. Build the adapter request
    const request: AdapterRequest = {
      systemPrompt:
        systemPromptOverride ??
        `You are a professional AI assistant specialising in ${taskType.replace(/_/g, ' ')}. Follow the user's instructions precisely.`,
      userPrompt,
      context,
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    };

    try {
      // =================================================================
      // ROUND 1: Parallel worker generation
      // =================================================================
      const { outputs, voteIdByLabel, labelToWorker } =
        await orchestrator.runRound1(request, logger);

      // =================================================================
      // ROUND 2: Claude blind judging
      // =================================================================
      await logger.updateSessionStatus('round_2_judging');
      const scorer = new Scorer(claudeAdapter);

      let judgeScores: JudgeScore[];
      let claudeJudgeCost = 0;
      let claudeJudgeTokens = 0;

      try {
        const judgeResult = await scorer.judgeOutputs(taskType, userPrompt, outputs);
        judgeScores = judgeResult.scores;
        claudeJudgeCost = judgeResult.claudeResponse.costUsd;
        claudeJudgeTokens =
          judgeResult.claudeResponse.tokensInput + judgeResult.claudeResponse.tokensOutput;
      } catch (judgeError) {
        // Retry once
        console.warn('[RoundManager] Judge failed, retrying once:', judgeError);
        try {
          const retryResult = await scorer.judgeOutputs(taskType, userPrompt, outputs);
          judgeScores = retryResult.scores;
          claudeJudgeCost = retryResult.claudeResponse.costUsd;
          claudeJudgeTokens =
            retryResult.claudeResponse.tokensInput + retryResult.claudeResponse.tokensOutput;
        } catch {
          // Fallback: return longest output as final
          return this.fallbackToLongestOutput(
            outputs,
            labelToWorker,
            startedAt,
            logger,
            sessionId,
          );
        }
      }

      await logger.recordJudgeScores(voteIdByLabel, judgeScores);

      // =================================================================
      // ROUND 3: Claude fusion / synthesis
      // =================================================================
      await logger.updateSessionStatus('round_3_fusing');
      const synthesizer = new Synthesizer(claudeAdapter);
      const { finalOutput, winnerLabel, claudeResponse: fusionResponse } =
        await synthesizer.fuse(taskType, userPrompt, outputs, judgeScores);

      const claudeFusionCost = fusionResponse.costUsd;
      const claudeFusionTokens =
        fusionResponse.tokensInput + fusionResponse.tokensOutput;

      // =================================================================
      // FINALISE
      // =================================================================
      const winnerWorker = labelToWorker.get(winnerLabel) ?? outputs[0].workerName;

      // Mark winner + contributing votes
      await this.markUsedInFusion(voteIdByLabel, winnerLabel, judgeScores);

      // Calculate totals
      const workerCost = outputs.reduce((sum, o) => sum + o.response.costUsd, 0);
      const workerTokens = outputs.reduce(
        (sum, o) => sum + o.response.tokensInput + o.response.tokensOutput,
        0,
      );
      const totalCostUsd = workerCost + claudeJudgeCost + claudeFusionCost;
      const totalTokens = workerTokens + claudeJudgeTokens + claudeFusionTokens;
      const durationMs = Date.now() - startedAt;

      await logger.finalizeSession(finalOutput, winnerWorker, totalCostUsd, totalTokens, durationMs);

      // Build scores map for the result
      const scoresMap = this.buildScoresMap(outputs, judgeScores, labelToWorker);

      // Insert history row
      await this.insertHistory(sessionId, taskType, winnerWorker, scoresMap);

      // Update org spend
      await this.updateOrgSpend(totalCostUsd);

      return {
        finalOutput,
        winnerWorker,
        scores: scoresMap,
        totalCostUsd,
        totalTokens,
        durationMs,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logger.markSessionFailed(message);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Private — Settings management
  // ---------------------------------------------------------------------------

  /**
   * Load settings for this org, creating defaults if no row exists.
   */
  private async loadOrCreateSettings(): Promise<OrgSettings> {
    const { data, error } = await this.supabase
      .from('ai_panel_settings')
      .select('*')
      .eq('org_id', this.orgId)
      .single();

    if (error || !data) {
      // Create default settings row
      const defaults: OrgSettings = {
        org_id: this.orgId,
        workers_enabled: DEFAULT_WORKERS_ENABLED,
        fusion_enabled_for: DEFAULT_FUSION_ENABLED_FOR,
        monthly_budget_usd: 100,
        current_month_spend_usd: 0,
      };

      const { error: insertError } = await this.supabase
        .from('ai_panel_settings')
        .insert(defaults);

      if (insertError) {
        console.error('[RoundManager] Failed to create default settings:', insertError.message);
      }

      return defaults;
    }

    return {
      org_id: data.org_id as string,
      workers_enabled: (data.workers_enabled as Record<WorkerName, boolean>) ?? DEFAULT_WORKERS_ENABLED,
      fusion_enabled_for: (data.fusion_enabled_for as TaskType[]) ?? DEFAULT_FUSION_ENABLED_FOR,
      monthly_budget_usd: (data.monthly_budget_usd as number) ?? 100,
      current_month_spend_usd: (data.current_month_spend_usd as number) ?? 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Private — Session management
  // ---------------------------------------------------------------------------

  /**
   * Create a new session row and return its ID.
   */
  private async createSession(
    taskType: TaskType,
    inputPrompt: string,
    inputContext?: Record<string, unknown>,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('ai_panel_sessions')
      .insert({
        org_id: this.orgId,
        user_id: this.userId,
        task_type: taskType,
        input_prompt: inputPrompt,
        input_context: inputContext ?? null,
        status: 'pending' as SessionStatus,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to create AI Panel session: ${error?.message ?? 'No data returned'}`,
      );
    }

    return (data as { id: string }).id;
  }

  // ---------------------------------------------------------------------------
  // Private — Claude adapter factory
  // ---------------------------------------------------------------------------

  /**
   * Create a ClaudeAdapter instance from environment variables.
   */
  private createClaudeAdapter(): ClaudeAdapter {
    const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured — Claude is required for judging and fusion.');
    }
    return new ClaudeAdapter({ apiKey, model: CLAUDE_MANAGER_MODEL });
  }

  // ---------------------------------------------------------------------------
  // Private — Fusion helpers
  // ---------------------------------------------------------------------------

  /**
   * Mark vote rows that were used in fusion.
   */
  private async markUsedInFusion(
    voteIdByLabel: Map<BlindLabel, string>,
    winnerLabel: BlindLabel,
    judgeScores: JudgeScore[],
  ): Promise<void> {
    // Winner is always marked
    const winnerVoteId = voteIdByLabel.get(winnerLabel);
    if (winnerVoteId) {
      try {
        await this.supabase
          .from('ai_panel_votes')
          .update({ used_in_fusion: true })
          .eq('id', winnerVoteId);
      } catch (err) {
        console.error('[RoundManager] Failed to mark winner used_in_fusion:', err);
      }
    }

    // Also mark any label whose bestParts were non-empty (contributed to fusion)
    for (const score of judgeScores) {
      if (score.blindLabel === winnerLabel) continue;
      if (score.bestParts.length > 0) {
        const voteId = voteIdByLabel.get(score.blindLabel);
        if (voteId) {
          try {
            await this.supabase
              .from('ai_panel_votes')
              .update({ used_in_fusion: true })
              .eq('id', voteId);
          } catch (err) {
            console.error('[RoundManager] Failed to mark contributing vote used_in_fusion:', err);
          }
        }
      }
    }
  }

  /**
   * Build a WorkerName → score map from judge results.
   */
  private buildScoresMap(
    outputs: WorkerOutput[],
    judgeScores: JudgeScore[],
    labelToWorker: Map<BlindLabel, WorkerName>,
  ): Record<WorkerName, number> {
    const scoresMap: Partial<Record<WorkerName, number>> = {};

    for (const score of judgeScores) {
      const worker = labelToWorker.get(score.blindLabel);
      if (worker) {
        scoresMap[worker] = score.score;
      }
    }

    // Ensure every output has an entry (default 0 for missing scores)
    for (const output of outputs) {
      if (scoresMap[output.workerName] === undefined) {
        scoresMap[output.workerName] = 0;
      }
    }

    return scoresMap as Record<WorkerName, number>;
  }

  // ---------------------------------------------------------------------------
  // Private — Fallback (when Round 2 JSON parse fails after retry)
  // ---------------------------------------------------------------------------

  /**
   * Fallback when Claude's judging fails: return the longest raw output.
   */
  private async fallbackToLongestOutput(
    outputs: WorkerOutput[],
    _labelToWorker: Map<BlindLabel, WorkerName>,
    startedAt: number,
    logger: RealtimeLogger,
    sessionId: string,
  ): Promise<FusionResult> {
    console.warn('[RoundManager] Falling back to longest output (judge parsing failed).');

    // Find longest output
    const sorted = [...outputs].sort(
      (a, b) => b.response.content.length - a.response.content.length,
    );
    const winner = sorted[0];
    const durationMs = Date.now() - startedAt;

    const workerCost = outputs.reduce((sum, o) => sum + o.response.costUsd, 0);
    const workerTokens = outputs.reduce(
      (sum, o) => sum + o.response.tokensInput + o.response.tokensOutput,
      0,
    );

    // Build a simple scores map (all zeros — no judging happened)
    const scoresMap: Partial<Record<WorkerName, number>> = {};
    for (const output of outputs) {
      scoresMap[output.workerName] = 0;
    }

    await logger.finalizeSession(
      winner.response.content,
      winner.workerName,
      workerCost,
      workerTokens,
      durationMs,
    );

    // Store fallback metadata
    try {
      await this.supabase
        .from('ai_panel_sessions')
        .update({
          final_output_metadata: {
            winner_worker: winner.workerName,
            fallback: true,
            reason: 'Judge JSON parsing failed after retry',
          },
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('[RoundManager] Failed to update fallback metadata:', err);
    }

    // Update org spend
    await this.updateOrgSpend(workerCost);

    return {
      finalOutput: winner.response.content,
      winnerWorker: winner.workerName,
      scores: scoresMap as Record<WorkerName, number>,
      totalCostUsd: workerCost,
      totalTokens: workerTokens,
      durationMs,
    };
  }

  // ---------------------------------------------------------------------------
  // Private — History & spend tracking
  // ---------------------------------------------------------------------------

  /**
   * Insert a row into ai_panel_history.
   */
  private async insertHistory(
    sessionId: string,
    taskType: TaskType,
    winnerWorker: WorkerName,
    workerScores: Record<WorkerName, number>,
  ): Promise<void> {
    try {
      await this.supabase.from('ai_panel_history').insert({
        session_id: sessionId,
        org_id: this.orgId,
        task_type: taskType,
        winner_worker: winnerWorker,
        worker_scores: workerScores,
        fusion_quality_rating: null,
        user_approved: null,
      });
    } catch (err) {
      console.error('[RoundManager] Failed to insert history row:', err);
    }
  }

  /**
   * Increment the organisation's current month spend.
   */
  private async updateOrgSpend(additionalCost: number): Promise<void> {
    try {
      // Read current spend, then increment
      const { data } = await this.supabase
        .from('ai_panel_settings')
        .select('current_month_spend_usd')
        .eq('org_id', this.orgId)
        .single();

      const currentSpend = (data?.current_month_spend_usd as number) ?? 0;

      await this.supabase
        .from('ai_panel_settings')
        .update({ current_month_spend_usd: currentSpend + additionalCost })
        .eq('org_id', this.orgId);
    } catch (err) {
      console.error('[RoundManager] Failed to update org spend:', err);
    }
  }
}
