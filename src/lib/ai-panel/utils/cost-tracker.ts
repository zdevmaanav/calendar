// =============================================================================
// AI Panel — Cost Tracker
// =============================================================================

import type { WorkerName } from '../types';
import { PRICING } from '../config';

/**
 * Calculate the USD cost for a worker's generation call.
 *
 * @param workerName - The worker whose pricing table to use.
 * @param tokensInput  - Number of input (prompt) tokens consumed.
 * @param tokensOutput - Number of output (completion) tokens consumed.
 * @returns Cost in USD, rounded to 6 decimal places.
 */
export function calculateCost(
  workerName: WorkerName,
  tokensInput: number,
  tokensOutput: number,
): number {
  const pricing = PRICING[workerName];
  const cost =
    (tokensInput / 1_000_000) * pricing.input +
    (tokensOutput / 1_000_000) * pricing.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/**
 * Calculate the USD cost for a Claude (Manager) call.
 *
 * @param tokensInput  - Number of input tokens consumed.
 * @param tokensOutput - Number of output tokens consumed.
 * @returns Cost in USD, rounded to 6 decimal places.
 */
export function calculateClaudeCost(
  tokensInput: number,
  tokensOutput: number,
): number {
  const pricing = PRICING.claude;
  const cost =
    (tokensInput / 1_000_000) * pricing.input +
    (tokensOutput / 1_000_000) * pricing.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
