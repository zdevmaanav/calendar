// =============================================================================
// AI Panel — Scorer (Round 2: Claude Blind Judging)
// =============================================================================

import type { JudgeScore, TaskType, WorkerOutput } from './types';
import { ClaudeAdapter } from './adapters/claude-adapter';
import { stripWorkerNames } from './utils/blind-labeler';
import { buildJudgePrompt } from './prompts/judge-prompt';

/**
 * Extract a JSON object from a string that may contain markdown fences
 * or preamble text.
 */
function extractJson(raw: string): string {
  // Strip markdown fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  }

  // If the whole thing parses, great
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Fallback: extract between first { and last }
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last > first) {
      return cleaned.slice(first, last + 1);
    }
    throw new Error('Could not extract valid JSON from Claude judge response');
  }
}

/**
 * Handles Round 2 — sends blind-labelled outputs to Claude for scoring.
 */
export class Scorer {
  private claudeAdapter: ClaudeAdapter;

  constructor(claudeAdapter: ClaudeAdapter) {
    this.claudeAdapter = claudeAdapter;
  }

  /**
   * Ask Claude to blind-judge the worker outputs and return scored results.
   *
   * @param taskType      - The type of task being evaluated.
   * @param userPrompt    - The original prompt the workers received.
   * @param workerOutputs - Successful worker outputs from Round 1.
   * @returns Array of JudgeScore objects, one per blind label.
   * @throws If Claude's response cannot be parsed as valid JSON after cleanup.
   */
  async judgeOutputs(
    taskType: TaskType,
    userPrompt: string,
    workerOutputs: WorkerOutput[],
  ): Promise<{ scores: JudgeScore[]; claudeResponse: import('./types').AdapterResponse }> {
    // Strip worker names so Claude sees only labels
    const blindOutputs = stripWorkerNames(workerOutputs);

    // Build the judge prompt
    const judgePrompt = buildJudgePrompt(taskType, userPrompt, blindOutputs);

    // Call Claude
    const claudeResponse = await this.claudeAdapter.generate({
      systemPrompt:
        'You are the Manager of an AI panel. Evaluate outputs blindly and return STRICT JSON only.',
      userPrompt: judgePrompt,
      maxTokens: 4096,
      temperature: 0.3,
    });

    if (!claudeResponse.success) {
      throw new Error(
        `Claude judging failed: ${claudeResponse.error ?? 'Unknown error'}`,
      );
    }

    // Parse JSON
    const jsonStr = extractJson(claudeResponse.content);
    const parsed: { scores: JudgeScore[] } = JSON.parse(jsonStr);

    // Basic validation
    if (!Array.isArray(parsed.scores) || parsed.scores.length === 0) {
      throw new Error('Claude judge response has no scores array');
    }

    for (const score of parsed.scores) {
      if (
        typeof score.blindLabel !== 'string' ||
        typeof score.score !== 'number' ||
        typeof score.feedback !== 'string'
      ) {
        throw new Error('Invalid JudgeScore shape in Claude response');
      }
      // Ensure bestParts is at least an empty array
      if (!Array.isArray(score.bestParts)) {
        score.bestParts = [];
      }
    }

    return { scores: parsed.scores, claudeResponse };
  }
}
