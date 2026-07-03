// =============================================================================
// AI Panel — Main Entry Point
// =============================================================================
//
// The AI Fusion engine is accessed through a single function: `runFusion()`.
// All internal complexity (3-round pipeline, blind labelling, Supabase logging,
// cost tracking) is hidden behind this clean interface.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FusionResult, TaskType } from './types';
import { RoundManager } from './round-manager';

// ---------------------------------------------------------------------------
// Re-exports — so consumers can `import { … } from '@/lib/ai-panel'`
// ---------------------------------------------------------------------------

export { RoundManager } from './round-manager';
export { Orchestrator } from './orchestrator';
export { Scorer } from './scorer';
export { Synthesizer } from './synthesizer';
export * from './types';
export * from './config';

// ---------------------------------------------------------------------------
// Convenience entry point
// ---------------------------------------------------------------------------

/**
 * Run the full AI Fusion pipeline — the ONE function the rest of the app calls.
 *
 * Creates a {@link RoundManager}, executes all three rounds (generate → judge → fuse),
 * and returns a {@link FusionResult} with the final output, scores, and cost data.
 *
 * @param supabase            - Authenticated Supabase client for DB operations.
 * @param orgId               - Organisation ID owning the session.
 * @param userId              - User ID triggering the fusion.
 * @param taskType            - The type of task (e.g. 'caption', 'content_calendar').
 * @param userPrompt          - The user's original prompt.
 * @param context             - Optional additional context for the adapters.
 * @param systemPromptOverride - Optional system prompt override for all workers.
 * @returns The final fused output along with scoring and cost metadata.
 *
 * @example
 * ```ts
 * import { createClient } from '@/lib/supabase/server';
 * import { runFusion } from '@/lib/ai-panel';
 *
 * const supabase = await createClient();
 * const result = await runFusion(
 *   supabase,
 *   orgId,
 *   userId,
 *   'caption',
 *   'Write an Instagram caption for our summer sale',
 * );
 * console.log(result.finalOutput);
 * ```
 */
export async function runFusion(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  taskType: TaskType,
  userPrompt: string,
  context?: Record<string, unknown>,
  systemPromptOverride?: string,
  existingSessionId?: string,
): Promise<FusionResult> {
  const manager = new RoundManager(supabase, orgId, userId);
  return manager.runFusion(taskType, userPrompt, context, systemPromptOverride, existingSessionId);
}
