// =============================================================================
// AI Panel — Fusion Prompt Builder
// =============================================================================

import type { BlindLabel, JudgeScore, TaskType } from '../types';

/** A blind output presented to Claude for fusion (no worker names). */
interface BlindOutput {
  label: BlindLabel;
  content: string;
}

/** Friendly display names for task types used inside the prompt. */
const TASK_TYPE_DISPLAY: Record<TaskType, string> = {
  brand_profile: 'brand profile generation',
  content_calendar: 'content calendar generation',
  caption: 'caption writing',
  image_prompt: 'image prompt creation',
  video_prompt: 'video prompt creation',
  ai_suggestion: 'AI suggestion generation',
  post_regeneration: 'post regeneration',
  scraping_analysis: 'scraping analysis',
};

/**
 * Build the prompt that tells Claude to fuse the best parts of multiple
 * AI outputs into one superior, coherent final output.
 *
 * @param taskType     - The type of task the workers were given.
 * @param userPrompt   - The original prompt all workers received.
 * @param judgeScores  - Claude's own scoring results from Round 2.
 * @param blindOutputs - Array of { label, content } with worker names stripped.
 * @returns A single string prompt ready to send as `userPrompt` to Claude.
 */
export function buildFusionPrompt(
  taskType: TaskType,
  userPrompt: string,
  judgeScores: JudgeScore[],
  blindOutputs: BlindOutput[],
): string {
  const taskDisplay = TASK_TYPE_DISPLAY[taskType] ?? taskType;

  // Present all versions
  const outputBlocks = blindOutputs
    .map(
      (o) =>
        `--- VERSION ${o.label} ---\n${o.content}\n--- END VERSION ${o.label} ---`,
    )
    .join('\n\n');

  // Present the scoring + best parts
  const scoreBlocks = judgeScores
    .map((s) => {
      const parts = s.bestParts
        .map(
          (p) =>
            `    • [${p.section}] "${p.content}" — ${p.reason}`,
        )
        .join('\n');
      return `Label ${s.blindLabel} — Score: ${s.score}/100\nFeedback: ${s.feedback}\nBest Parts:\n${parts}`;
    })
    .join('\n\n');

  // Find the highest-scoring label
  const sorted = [...judgeScores].sort((a, b) => b.score - a.score);
  const topLabel = sorted[0]?.blindLabel ?? 'A';

  return `You are the Synthesizer of an AI panel. Multiple AI writers produced different versions of the same task. You previously judged them. Now your job is to take the BEST ELEMENTS from each version and weave them into ONE seamless, superior final output.

TASK TYPE: ${taskDisplay}

ORIGINAL PROMPT:
"""
${userPrompt}
"""

HERE ARE THE VERSIONS:

${outputBlocks}

YOUR PREVIOUS SCORING:

${scoreBlocks}

SYNTHESIS INSTRUCTIONS:
1. Use Version ${topLabel} (highest score) as the structural backbone.
2. Integrate the best parts you identified from other versions where they genuinely improve the result.
3. Do NOT simply concatenate sections — the final output must read as one coherent, polished piece.
4. Preserve the task's required format. If the task is "${taskDisplay}", your output should be a ${taskDisplay} — not a report about it.
5. The final output should be noticeably better than any individual version.

Respond with ONLY the following JSON object. No markdown fences, no preamble, no commentary outside the JSON:
{
  "finalOutput": "the complete fused final content here — ready to deliver to the user",
  "rationale": "Brief 1-2 sentence explanation of what was combined from which versions and why."
}`;
}
