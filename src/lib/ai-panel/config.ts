// =============================================================================
// AI Panel — Configuration & Pricing
// =============================================================================

import type { WorkerName, BlindLabel } from './types';

/** Default model string for each worker AI. */
export const WORKER_MODELS: Record<WorkerName, string> = {
  gemini: 'gemini-2.5-pro-preview-03-25',
  gpt4o: 'gpt-4o',
  llama: 'llama-3.1-70b-versatile',
  mistral: 'mistral-large-latest',
  kimi: 'moonshot-v1-32k',
} as const;

/** Claude model used as the Manager (judge + fuser). */
export const CLAUDE_MANAGER_MODEL = 'claude-sonnet-4-20250514';

/**
 * Pricing in USD **per 1 000 000 tokens**.
 * Includes all five workers plus Claude (manager).
 */
export const PRICING: Record<WorkerName | 'claude', { input: number; output: number }> = {
  gemini:  { input: 1.25,  output: 10.00 },
  gpt4o:   { input: 2.50,  output: 10.00 },
  llama:   { input: 0.59,  output: 0.79  },
  mistral: { input: 2.00,  output: 6.00  },
  kimi:    { input: 0.60,  output: 2.50  },
  claude:  { input: 3.00,  output: 15.00 },
} as const;

/** Blind labels available for assignment to workers. */
export const BLIND_LABELS: readonly BlindLabel[] = ['A', 'B', 'C', 'D', 'E'] as const;

/** Default maximum tokens for a single generation call. */
export const DEFAULT_MAX_TOKENS = 2048;

/** Default temperature for generation calls. */
export const DEFAULT_TEMPERATURE = 0.7;
