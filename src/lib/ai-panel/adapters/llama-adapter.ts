// =============================================================================
// AI Panel — Llama Adapter (via Groq)
// =============================================================================

import OpenAI from 'openai';
import type { AdapterRequest, AdapterResponse } from '../types';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '../config';
import { calculateCost } from '../utils/cost-tracker';
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for Meta Llama hosted on Groq.
 *
 * Groq exposes an OpenAI-compatible API, so we reuse the `openai` SDK
 * with `baseURL` set to `https://api.groq.com/openai/v1`.
 */
export class LlamaAdapter extends BaseAdapter {
  /**
   * Generate content using Llama via Groq.
   *
   * @param request - Normalised adapter request.
   * @returns Normalised adapter response with real latency and cost.
   */
  async generate(request: AdapterRequest): Promise<AdapterResponse> {
    if (!this.isAvailable) {
      return this.handleError(new Error('Llama/Groq key not configured'), this.config.model);
    }

    try {
      const client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
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
      const costUsd = calculateCost('llama', tokensInput, tokensOutput);

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
