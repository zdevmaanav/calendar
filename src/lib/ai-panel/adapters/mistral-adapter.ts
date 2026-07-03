// =============================================================================
// AI Panel — Mistral Adapter
// =============================================================================

import { Mistral } from '@mistralai/mistralai';
import type { AdapterRequest, AdapterResponse } from '../types';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '../config';
import { calculateCost } from '../utils/cost-tracker';
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for Mistral AI (via the `@mistralai/mistralai` SDK).
 */
export class MistralAdapter extends BaseAdapter {
  /**
   * Generate content using Mistral.
   *
   * @param request - Normalised adapter request.
   * @returns Normalised adapter response with real latency and cost.
   */
  async generate(request: AdapterRequest): Promise<AdapterResponse> {
    if (!this.isAvailable) {
      return this.handleError(new Error('Mistral API key not configured'), this.config.model);
    }

    try {
      const client = new Mistral({ apiKey: this.config.apiKey });

      const { result: response, latencyMs } = await this.measureLatency(() =>
        client.chat.complete({
          model: this.config.model,
          maxTokens: request.maxTokens ?? this.config.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: request.temperature ?? this.config.temperature ?? DEFAULT_TEMPERATURE,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
        }),
      );

      const content =
        typeof response.choices?.[0]?.message?.content === 'string'
          ? response.choices[0].message.content
          : '';
      const tokensInput = response.usage?.promptTokens ?? 0;
      const tokensOutput = response.usage?.completionTokens ?? 0;
      const costUsd = calculateCost('mistral', tokensInput, tokensOutput);

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
