// =============================================================================
// AI Panel — Synthesizer (Round 3: Claude Fusion)
// =============================================================================

import type { BlindLabel, JudgeScore, TaskType, WorkerOutput } from './types';
import { ClaudeAdapter } from './adapters/claude-adapter';
import { stripWorkerNames } from './utils/blind-labeler';
import { buildFusionPrompt } from './prompts/fusion-prompt';

/**
 * Extract a JSON object from a string that may contain markdown fences
 * or preamble text.
 */
function extractJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  }

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last > first) {
      return cleaned.slice(first, last + 1);
    }
    throw new Error('Could not extract valid JSON from Claude fusion response');
  }
}

/**
 * Handles Round 3 — Claude fuses the best parts of all outputs into one
 * superior final output.
 */
export class Synthesizer {
  private claudeAdapter: ClaudeAdapter;

  constructor(claudeAdapter: ClaudeAdapter) {
    this.claudeAdapter = claudeAdapter;
  }

  /**
   * Fuse the best parts of worker outputs into a single final output.
   *
   * @param taskType      - The type of task.
   * @param userPrompt    - The original user prompt.
   * @param workerOutputs - Successful worker outputs from Round 1.
   * @param judgeScores   - Claude's scoring from Round 2.
   * @returns The fused output, rationale, winner label, and Claude's adapter response.
   */
  async fuse(
    taskType: TaskType,
    userPrompt: string,
    workerOutputs: WorkerOutput[],
    judgeScores: JudgeScore[],
  ): Promise<{
    finalOutput: string;
    rationale: string;
    winnerLabel: BlindLabel;
    claudeResponse: import('./types').AdapterResponse;
  }> {
    // Determine highest-scoring label
    const sorted = [...judgeScores].sort((a, b) => b.score - a.score);
    const winnerLabel = sorted[0]?.blindLabel ?? ('A' as BlindLabel);

    // Build fusion prompt with blind outputs
    const blindOutputs = stripWorkerNames(workerOutputs);
    const fusionPrompt = buildFusionPrompt(
      taskType,
      userPrompt,
      judgeScores,
      blindOutputs,
    );

    // Call Claude
    const claudeResponse = await this.claudeAdapter.generate({
      systemPrompt:
        'You are the Synthesizer of an AI panel. Your job is to combine the best parts of multiple AI outputs into one superior final output. Return STRICT JSON only.',
      userPrompt: fusionPrompt,
      maxTokens: 4096,
      temperature: 0.5,
    });

    if (!claudeResponse.success) {
      throw new Error(
        `Claude fusion failed: ${claudeResponse.error ?? 'Unknown error'}`,
      );
    }

    // Parse JSON
    const jsonStr = extractJson(claudeResponse.content);
    const parsed: { finalOutput: string; rationale: string } =
      JSON.parse(jsonStr);

    if (typeof parsed.finalOutput !== 'string' || !parsed.finalOutput) {
      throw new Error('Claude fusion response missing finalOutput');
    }

    return {
      finalOutput: parsed.finalOutput,
      rationale: parsed.rationale ?? '',
      winnerLabel,
      claudeResponse,
    };
  }
}
