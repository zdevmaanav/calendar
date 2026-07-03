// =============================================================================
// AI Panel — Judge Prompt Builder
// =============================================================================

import type { BlindLabel, TaskType } from '../types';

/** A blind output presented to Claude for judging (no worker names). */
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
 * Build the system+user prompt that tells Claude to blind-judge worker outputs.
 *
 * Claude sees each output labelled only A–E and scores them on a strict
 * 100-point rubric, returning structured JSON.
 *
 * @param taskType    - The type of task the workers were given.
 * @param userPrompt  - The original prompt all workers received.
 * @param blindOutputs - Array of { label, content } with worker names stripped.
 * @returns A single string prompt ready to send as `userPrompt` to Claude.
 */
export function buildJudgePrompt(
  taskType: TaskType,
  userPrompt: string,
  blindOutputs: BlindOutput[],
): string {
  const taskDisplay = TASK_TYPE_DISPLAY[taskType] ?? taskType;

  const outputBlocks = blindOutputs
    .map(
      (o) =>
        `--- VERSION ${o.label} ---\n${o.content}\n--- END VERSION ${o.label} ---`,
    )
    .join('\n\n');

  return `You are the Manager of an AI panel. Your job is to evaluate the following outputs BLINDLY. You do NOT know which AI wrote each version — they are labelled only by letter.

TASK TYPE: ${taskDisplay}

ORIGINAL PROMPT GIVEN TO ALL WRITERS:
"""
${userPrompt}
"""

Below are the outputs produced by different AI writers. Evaluate each one independently.

${outputBlocks}

EVALUATION RUBRIC (100 points total per version):
1. Quality — overall excellence of the output (0-40 points)
2. Relevance — how well it fulfils the original task and prompt (0-30 points)
3. Creativity — originality, fresh angles, unique phrasing (0-20 points)
4. Alignment — how well it matches brand/task requirements and tone (0-10 points)

INSTRUCTIONS:
- Score each version on the rubric above. The total per version must be 0-100.
- For each version, identify the BEST PARTS — specific sentences, phrases, structural ideas, or sections that stand out as particularly strong.
- Be critical but fair. If a version is mediocre, score it in the 40-60 range. Reserve 80+ for genuinely excellent work.

Respond with ONLY the following JSON object. No markdown fences, no preamble, no commentary outside the JSON:
{
  "scores": [
    {
      "blindLabel": "A",
      "score": 87,
      "feedback": "Concise 2-3 sentence evaluation of this version's strengths and weaknesses.",
      "bestParts": [
        { "section": "opening", "content": "actual text snippet from this version", "reason": "why this part is strong" }
      ]
    }
  ]
}

You MUST include an entry for every version label shown above: ${blindOutputs.map((o) => o.label).join(', ')}.`;
}
