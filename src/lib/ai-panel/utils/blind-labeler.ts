// =============================================================================
// AI Panel — Blind Labeler
// =============================================================================

import type { WorkerName, BlindLabel, WorkerOutput } from '../types';
import { BLIND_LABELS } from '../config';

/**
 * Randomly assign blind labels (A–E) to an array of worker names.
 *
 * Uses the Fisher-Yates shuffle so every permutation is equally likely.
 *
 * @param workerNames - Array of enabled workers (up to 5).
 * @returns A Map from each WorkerName to its randomly-assigned BlindLabel.
 *
 * @example
 * ```ts
 * const labels = assignBlindLabels(['gemini', 'gpt4o', 'mistral', 'kimi']);
 * // e.g. Map { gemini → 'C', gpt4o → 'A', mistral → 'D', kimi → 'B' }
 * ```
 */
export function assignBlindLabels(
  workerNames: WorkerName[],
): Map<WorkerName, BlindLabel> {
  // Copy the labels so we don't mutate the const array
  const labels: BlindLabel[] = [...BLIND_LABELS];

  // Fisher-Yates shuffle
  for (let i = labels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }

  const mapping = new Map<WorkerName, BlindLabel>();
  workerNames.forEach((worker, index) => {
    mapping.set(worker, labels[index]);
  });

  return mapping;
}

/**
 * Strip worker names from outputs so Claude only sees blind labels + content.
 *
 * This is the data structure Claude receives during the judging round —
 * it has no knowledge of which AI produced which output.
 *
 * @param outputs - Array of WorkerOutput objects (with worker names).
 * @returns Array containing only the blind label and the raw content string.
 */
export function stripWorkerNames(
  outputs: WorkerOutput[],
): Array<{ label: BlindLabel; content: string }> {
  return outputs.map((output) => ({
    label: output.blindLabel,
    content: output.response.content,
  }));
}
