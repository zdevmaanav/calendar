// =============================================================================
// AI Panel — Kimi (Moonshot) Adapter
// =============================================================================

import OpenAI from 'openai';
import type { AdapterRequest, AdapterResponse } from '../types';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '../config';
import { calculateCost } from '../utils/cost-tracker';
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for Kimi / Moonshot AI.
 *
 * Kimi exposes an OpenAI-compatible API, so we reuse the `openai` SDK
 * with a custom `baseURL` pointing at `https://api.moonshot.ai/v1`.
 */
export class KimiAdapter extends BaseAdapter {
  /**
   * Generate content using Kimi (Moonshot).
   *
   * @param request - Normalised adapter request.
   * @returns Normalised adapter response with real latency and cost.
   */
  async generate(request: AdapterRequest): Promise<AdapterResponse> {
    if (!this.isAvailable) {
      return this.handleError(new Error('Kimi/Moonshot API key not configured'), this.config.model);
    }

    try {
      const client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: 'https://api.moonshot.ai/v1',
      });

      const { result: completion, latencyMs } = await this.measureLatency(() =>
        client.chat.completions.create({
          model: this.config.model,
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: request.temperature ?? this.config.temperature ?? DEFAULT_TEMPERATURE,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
        }),
      );

      const content = completion.choices[0]?.message?.content ?? '';
      const tokensInput = completion.usage?.prompt_tokens ?? 0;
      const tokensOutput = completion.usage?.completion_tokens ?? 0;
      const costUsd = calculateCost('kimi', tokensInput, tokensOutput);

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
