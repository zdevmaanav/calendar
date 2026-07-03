// =============================================================================
// AI Panel — Claude Adapter (Manager / Judge / Fuser)
// =============================================================================

import Anthropic from '@anthropic-ai/sdk';
import type { AdapterRequest, AdapterResponse } from '../types';
import { calculateClaudeCost } from '../utils/cost-tracker';
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for Anthropic Claude — the **Manager** AI.
 *
 * Claude is NOT a worker. It is used exclusively for:
 * 1. **Judging** — blind-scoring the 5 worker outputs.
 * 2. **Fusing** — synthesising the best parts into a single final output.
 */
export class ClaudeAdapter extends BaseAdapter {
  /**
   * Generate content using Claude.
   *
   * @param request - Normalised adapter request.
   * @returns Normalised adapter response with real latency and cost.
   */
  async generate(request: AdapterRequest): Promise<AdapterResponse> {
    if (!this.isAvailable) {
      return this.handleError(new Error('Anthropic API key not configured'), this.config.model);
    }

    try {
      const client = new Anthropic({ apiKey: this.config.apiKey });

      const { result: response, latencyMs } = await this.measureLatency(() =>
        client.messages.create({
          model: this.config.model,
          system: request.systemPrompt,
          messages: [{ role: 'user', content: request.userPrompt }],
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
        }),
      );

      const textBlock = response.content.find((block) => block.type === 'text');
      const content = textBlock && 'text' in textBlock ? textBlock.text : '';

      const tokensInput = response.usage.input_tokens;
      const tokensOutput = response.usage.output_tokens;
      const costUsd = calculateClaudeCost(tokensInput, tokensOutput);

      return {
        content,
        tokensInput,
        tokensOutput,
        costUsd,
        latencyMs,
        model: this.config.model,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, this.config.model);
    }
  }
}
