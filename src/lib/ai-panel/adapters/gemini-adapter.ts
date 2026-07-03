// =============================================================================
// AI Panel — Gemini Adapter
// =============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AdapterRequest, AdapterResponse } from '../types';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '../config';
import { calculateCost } from '../utils/cost-tracker';
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for Google Gemini (via the `@google/generative-ai` SDK).
 *
 * Gemini doesn't expose a dedicated system-message role in the basic
 * `generateContent` API, so we prefix the system prompt before the user
 * prompt in a single string.
 */
export class GeminiAdapter extends BaseAdapter {
  /**
   * Generate content using the Gemini model.
   *
   * @param request - Normalised adapter request.
   * @returns Normalised adapter response with real latency and cost.
   */
  async generate(request: AdapterRequest): Promise<AdapterResponse> {
    if (!this.isAvailable) {
      return this.handleError(new Error('Gemini API key not configured'), this.config.model);
    }

    try {
      const genAI = new GoogleGenerativeAI(this.config.apiKey);
      const model = genAI.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: request.maxTokens ?? this.config.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: request.temperature ?? this.config.temperature ?? DEFAULT_TEMPERATURE,
        },
      });

      // Combine system + user prompt
      const combinedPrompt = `SYSTEM: ${request.systemPrompt}\n\nUSER: ${request.userPrompt}`;

      const { result: response, latencyMs } = await this.measureLatency(() =>
        model.generateContent(combinedPrompt),
      );

      const generationResponse = response.response;
      const content = generationResponse.text();
      const usage = generationResponse.usageMetadata;

      const tokensInput = usage?.promptTokenCount ?? 0;
      const tokensOutput = usage?.candidatesTokenCount ?? 0;
      const costUsd = calculateCost('gemini', tokensInput, tokensOutput);

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
