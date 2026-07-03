// =============================================================================
// AI Panel — Type Definitions
// =============================================================================

/** The five worker AIs that generate outputs in parallel. */
export type WorkerName = 'gemini' | 'gpt4o' | 'llama' | 'mistral' | 'kimi';

/** Blind labels assigned randomly to workers so Claude judges without bias. */
export type BlindLabel = 'A' | 'B' | 'C' | 'D' | 'E';

/** Task types the AI Panel can handle. */
export type TaskType =
  | 'brand_profile'
  | 'content_calendar'
  | 'caption'
  | 'image_prompt'
  | 'video_prompt'
  | 'ai_suggestion'
  | 'post_regeneration'
  | 'scraping_analysis';

/** Lifecycle status of an entire AI Panel session. */
export type SessionStatus =
  | 'pending'
  | 'round_1_generating'
  | 'round_2_judging'
  | 'round_3_fusing'
  | 'completed'
  | 'failed';

/** Status of an individual worker within a session. */
export type WorkerStatus = 'pending' | 'writing' | 'completed' | 'failed';

// ---------------------------------------------------------------------------
// Adapter Interfaces
// ---------------------------------------------------------------------------

/** Configuration required to initialise an AI adapter. */
export interface AdapterConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/** Normalised request payload sent to every adapter. */
export interface AdapterRequest {
  systemPrompt: string;
  userPrompt: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

/** Normalised response returned by every adapter. */
export interface AdapterResponse {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  latencyMs: number;
  model: string;
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Panel Pipeline Interfaces
// ---------------------------------------------------------------------------

/** A single worker's output paired with its blind label. */
export interface WorkerOutput {
  workerName: WorkerName;
  blindLabel: BlindLabel;
  response: AdapterResponse;
}

/** Claude's score for one blind-labelled submission. */
export interface JudgeScore {
  blindLabel: BlindLabel;
  /** Quality score from 0 – 100. */
  score: number;
  feedback: string;
  bestParts: Array<{
    section: string;
    content: string;
    reason: string;
  }>;
}

/** The final fused output after Claude judges and synthesises. */
export interface FusionResult {
  finalOutput: string;
  winnerWorker: WorkerName;
  scores: Record<WorkerName, number>;
  totalCostUsd: number;
  totalTokens: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Database Row Interfaces (Supabase table shapes)
// ---------------------------------------------------------------------------

/** Row shape for the `ai_panel_sessions` table. */
export interface AiPanelSession {
  id: string;
  org_id: string;
  user_id: string;
  task_type: TaskType;
  input_prompt: string;
  input_context: Record<string, unknown> | null;
  status: SessionStatus;
  final_output: string | null;
  final_output_metadata: Record<string, unknown> | null;
  total_cost_usd: number;
  total_tokens_used: number;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

/** Row shape for the `ai_panel_votes` table. */
export interface AiPanelVote {
  id: string;
  session_id: string;
  worker_name: WorkerName;
  blind_label: BlindLabel;
  worker_status: WorkerStatus;
  worker_output: string | null;
  worker_tokens_input: number | null;
  worker_tokens_output: number | null;
  worker_cost_usd: number | null;
  worker_latency_ms: number | null;
  worker_error: string | null;
  claude_score: number | null;
  claude_feedback: string | null;
  claude_best_parts: Array<{ section: string; content: string; reason: string }> | null;
  used_in_fusion: boolean;
}

/** All valid task type values — used for runtime validation. */
export const VALID_TASK_TYPES: readonly TaskType[] = [
  'brand_profile',
  'content_calendar',
  'caption',
  'image_prompt',
  'video_prompt',
  'ai_suggestion',
  'post_regeneration',
  'scraping_analysis',
] as const;
