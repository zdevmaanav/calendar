// =============================================================================
// AI Panel — Base Adapter (Abstract)
// =============================================================================

import type { AdapterConfig, AdapterRequest, AdapterResponse } from '../types';

/**
 * Abstract base class for every AI provider adapter.
 *
 * Concrete adapters implement {@link generate} while inheriting shared helpers
 * for latency measurement and error handling.
 */
export abstract class BaseAdapter {
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  // ---------------------------------------------------------------------------
  // Abstract — must be implemented by each provider adapter
  // ---------------------------------------------------------------------------

  /**
   * Send a generation request to the AI provider and return a normalised
   * {@link AdapterResponse}.
   *
   * Implementations MUST:
   * 1. Return `success: false` (not throw) on any error.
   * 2. Measure real latency via {@link measureLatency}.
   * 3. Populate `costUsd` from actual token counts.
   */
  abstract generate(request: AdapterRequest): Promise<AdapterResponse>;

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  /**
   * Wrap an async operation and measure wall-clock latency.
   *
   * @param fn - The async function to time.
   * @returns An object containing the original result and elapsed milliseconds.
   */
  protected async measureLatency<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; latencyMs: number }> {
    const start = Date.now();
    const result = await fn();
    const latencyMs = Date.now() - start;
    return { result, latencyMs };
  }

  /**
   * Build a failure {@link AdapterResponse} from an unknown error.
   *
   * @param error - The caught error value.
   * @param model - Model identifier to include in the response.
   * @returns A well-formed AdapterResponse with `success: false`.
   */
  protected handleError(error: unknown, model: string): AdapterResponse {
    const message =
      error instanceof Error ? error.message : String(error);

    return {
      content: '',
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      latencyMs: 0,
      model,
      success: false,
      error: message,
    };
  }

  /**
   * Whether this adapter has a non-empty API key and can attempt calls.
   */
  get isAvailable(): boolean {
    return typeof this.config.apiKey === 'string' && this.config.apiKey.length > 0;
  }
}
