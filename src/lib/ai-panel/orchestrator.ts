// =============================================================================
// AI Panel — Orchestrator (Round 1: Parallel Worker Generation)
// =============================================================================

import type {
  AdapterRequest,
  AdapterResponse,
  BlindLabel,
  WorkerName,
  WorkerOutput,
} from './types';
import { WORKER_MODELS } from './config';
import { assignBlindLabels } from './utils/blind-labeler';
import { RealtimeLogger } from './utils/realtime-logger';

// Adapters
import { GeminiAdapter } from './adapters/gemini-adapter';
import { GPT4oAdapter } from './adapters/gpt4o-adapter';
import { LlamaAdapter } from './adapters/llama-adapter';
import { MistralAdapter } from './adapters/mistral-adapter';
import { KimiAdapter } from './adapters/kimi-adapter';
import { BaseAdapter } from './adapters/base-adapter';

/** Environment variable names for each worker's API key. */
const ENV_KEY_MAP: Record<WorkerName, string> = {
  gemini: 'GEMINI_API_KEY',
  gpt4o: 'OPENAI_API_KEY',
  llama: 'GROQ_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  kimi: 'KIMI_API_KEY',
};

/**
 * Instantiate the correct adapter for a given worker.
 *
 * @param workerName - Which worker to create.
 * @returns An adapter instance (may have `isAvailable === false` if the key is missing).
 */
function createAdapter(workerName: WorkerName): BaseAdapter {
  const apiKey = process.env[ENV_KEY_MAP[workerName]] ?? '';
  const model = WORKER_MODELS[workerName];

  switch (workerName) {
    case 'gemini':
      return new GeminiAdapter({ apiKey, model });
    case 'gpt4o':
      return new GPT4oAdapter({ apiKey, model });
    case 'llama':
      return new LlamaAdapter({ apiKey, model });
    case 'mistral':
      return new MistralAdapter({ apiKey, model });
    case 'kimi':
      return new KimiAdapter({ apiKey, model });
  }
}

/**
 * Orchestrates Round 1 — runs all enabled workers in parallel and collects
 * their outputs.
 *
 * Failed workers are logged but excluded from the results.
 * If **every** worker fails, an error is thrown.
 */
export class Orchestrator {
  private workersEnabled: Record<WorkerName, boolean>;

  constructor(workersEnabled: Record<WorkerName, boolean>) {
    this.workersEnabled = workersEnabled;
  }

  /**
   * Run Round 1: parallel worker generation.
   *
   * @param request - The normalised adapter request all workers receive.
   * @param logger  - Realtime logger for live Supabase updates.
   * @returns Object with `outputs` (successful WorkerOutput[]) and metadata maps
   *          needed by later rounds.
   */
  async runRound1(
    request: AdapterRequest,
    logger: RealtimeLogger,
  ): Promise<{
    outputs: WorkerOutput[];
    voteIdByLabel: Map<BlindLabel, string>;
    labelToWorker: Map<BlindLabel, WorkerName>;
  }> {
    // Collect enabled + available workers
    const enabledWorkers: WorkerName[] = (
      Object.entries(this.workersEnabled) as Array<[WorkerName, boolean]>
    )
      .filter(([name, enabled]) => {
        if (!enabled) return false;
        const adapter = createAdapter(name);
        return adapter.isAvailable;
      })
      .map(([name]) => name);

    if (enabledWorkers.length === 0) {
      throw new Error(
        'No workers enabled. Configure at least one AI worker in settings.',
      );
    }

    // Assign blind labels
    const blindMap = assignBlindLabels(enabledWorkers);

    // Create vote records + build lookup maps
    const voteIdByWorker = new Map<WorkerName, string>();
    const voteIdByLabel = new Map<BlindLabel, string>();
    const labelToWorker = new Map<BlindLabel, WorkerName>();

    for (const worker of enabledWorkers) {
      const label = blindMap.get(worker)!;
      const voteId = await logger.createVoteRecord(worker, label);
      voteIdByWorker.set(worker, voteId);
      voteIdByLabel.set(label, voteId);
      labelToWorker.set(label, worker);
    }

    // Update session status
    await logger.updateSessionStatus('round_1_generating');

    // Build per-worker promises
    const tasks = enabledWorkers.map(async (workerName): Promise<WorkerOutput | null> => {
      const voteId = voteIdByWorker.get(workerName)!;
      const label = blindMap.get(workerName)!;
      const adapter = createAdapter(workerName);

      await logger.updateVoteStatus(voteId, 'writing');

      let response: AdapterResponse;
      try {
        response = await adapter.generate(request);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logger.recordWorkerError(voteId, msg);
        return null;
      }

      if (!response.success) {
        await logger.recordWorkerError(voteId, response.error ?? 'Unknown adapter error');
        return null;
      }

      await logger.recordWorkerOutput(voteId, response);
      return { workerName, blindLabel: label, response };
    });

    // Run all in parallel — allSettled so one failure doesn't abort others
    const settled = await Promise.allSettled(tasks);

    const outputs: WorkerOutput[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value !== null) {
        outputs.push(result.value);
      }
    }

    if (outputs.length === 0) {
      throw new Error('All workers failed in Round 1');
    }

    return { outputs, voteIdByLabel, labelToWorker };
  }
}
