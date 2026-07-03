'use client';

// =============================================================================
// Component — FusionTicker
// Gemini chatbot-style live progress ticker for the AI Fusion pipeline.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Brain,
  Feather,
  Scale,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useFusionSession } from '@/lib/hooks/useFusionSession';
import type { AiPanelVote } from '@/lib/ai-panel/types';
import FusionTickerLine from './FusionTickerLine';
import FusionResultCard from './FusionResultCard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FusionTickerProps {
  /** Session ID to subscribe to. Pass null when idle. */
  sessionId: string | null;
  /** Fired once when fusion completes. */
  onComplete?: (finalOutput: string) => void;
  /** Fired once when fusion fails. */
  onFailed?: (error: string) => void;
}

// ---------------------------------------------------------------------------
// Worker display names
// ---------------------------------------------------------------------------

const WORKER_DISPLAY: Record<string, string> = {
  gemini: 'Gemini',
  gpt4o: 'GPT-4o',
  llama: 'Llama',
  mistral: 'Mistral',
  kimi: 'Kimi',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format elapsed seconds as "X.Xs" */
function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Sort votes by blind_label for consistent display */
function sortVotes(votes: AiPanelVote[]): AiPanelVote[] {
  return [...votes].sort((a, b) => a.blind_label.localeCompare(b.blind_label));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Live AI Fusion progress ticker — Gemini chatbot-style.
 *
 * Shows real-time status updates as the 3-round pipeline executes:
 * analyzing → writing (with per-worker sub-lines) → judging → fusing → done.
 *
 * Uses `useFusionSession` hook for Supabase Realtime + polling fallback.
 * Announces status changes via `aria-live="polite"` for screen readers.
 */
export default function FusionTicker({
  sessionId,
  onComplete,
  onFailed,
}: FusionTickerProps) {
  const { session, votes, isComplete, isFailed, finalOutput } =
    useFusionSession(sessionId);

  // Elapsed time (ticks every 100ms while session is active)
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track whether callbacks have been fired
  const completeFired = useRef(false);
  const failedFired = useRef(false);

  // Reset refs when sessionId changes
  useEffect(() => {
    completeFired.current = false;
    failedFired.current = false;
    startTimeRef.current = Date.now();
    setElapsed(0);
  }, [sessionId]);

  // Elapsed time ticker
  useEffect(() => {
    if (!sessionId || isComplete || isFailed) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const start = session?.started_at
      ? new Date(session.started_at).getTime()
      : startTimeRef.current;

    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, isComplete, isFailed, session?.started_at]);

  // Fire onComplete / onFailed once
  const handleComplete = useCallback(() => {
    if (completeFired.current) return;
    completeFired.current = true;
    if (finalOutput) onComplete?.(finalOutput);
  }, [finalOutput, onComplete]);

  const handleFailed = useCallback(() => {
    if (failedFired.current) return;
    failedFired.current = true;
    const reason =
      (session?.final_output_metadata as Record<string, unknown> | null)?.error as string
      ?? 'Fusion failed';
    onFailed?.(reason);
  }, [session?.final_output_metadata, onFailed]);

  useEffect(() => {
    if (isComplete) handleComplete();
    if (isFailed) handleFailed();
  }, [isComplete, isFailed, handleComplete, handleFailed]);

  // Don't render anything if there's no session
  if (!sessionId) return null;

  const status = session?.status ?? 'pending';
  const sortedVotes = sortVotes(votes);
  const workerCount = sortedVotes.length;

  // Determine which stages are past/active/pending
  const isPast = (stage: string) => {
    const order = ['pending', 'round_1_generating', 'round_2_judging', 'round_3_fusing', 'completed', 'failed'];
    return order.indexOf(status) > order.indexOf(stage);
  };

  const isActive = (stage: string) => status === stage;

  const stageStatus = (stage: string): 'active' | 'complete' | 'pending' => {
    if (isPast(stage)) return 'complete';
    if (isActive(stage)) return 'active';
    return 'pending';
  };

  return (
    <div
      className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-sm backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="AI Fusion progress"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Sparkles className="h-4 w-4 text-[#4F46E5]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {isComplete
              ? 'Fusion complete'
              : isFailed
                ? 'Fusion failed'
                : 'AI Fusion in progress'}
          </h3>
          {!isComplete && !isFailed && (
            <p className="text-xs text-gray-400">
              {formatElapsed(elapsed)} elapsed
            </p>
          )}
          {(isComplete || isFailed) && session?.duration_ms && (
            <p className="text-xs text-gray-400">
              Completed in {formatElapsed(session.duration_ms)}
            </p>
          )}
        </div>

        {/* Status dot */}
        {!isComplete && !isFailed && (
          <span className="h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse" />
        )}
        {isComplete && (
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        )}
        {isFailed && (
          <span className="h-2 w-2 rounded-full bg-red-500" />
        )}
      </div>

      {/* Divider */}
      <div className="mb-3 h-px bg-gray-100" />

      {/* Ticker body */}
      <div className="space-y-0.5">
        {/* Step 1: Analyzing */}
        <FusionTickerLine
          timestamp={formatElapsed(0)}
          icon={<Brain className="h-4 w-4" />}
          label="Analyzing your request..."
          status={stageStatus('pending')}
        />

        {/* Step 2: Writing with N workers */}
        {(isPast('pending') || isActive('round_1_generating')) && (
          <FusionTickerLine
            timestamp={formatElapsed(
              isActive('round_1_generating') ? elapsed : Math.min(elapsed, 1000),
            )}
            icon={<Feather className="h-4 w-4" />}
            label={`Writing with ${workerCount || '...'} AI models in parallel`}
            status={stageStatus('round_1_generating')}
          >
            {/* Per-worker sub-lines */}
            {sortedVotes.map((vote) => (
              <div
                key={vote.id}
                className="flex items-center gap-2 py-0.5"
              >
                <span className="w-5 text-right font-mono text-[10px] text-gray-300">
                  {vote.blind_label}
                </span>
                <span className="h-px flex-1 bg-gray-100" />
                <span
                  className={`text-xs ${
                    vote.worker_status === 'completed'
                      ? 'text-gray-500'
                      : vote.worker_status === 'writing'
                        ? 'text-[#4F46E5] font-medium'
                        : vote.worker_status === 'failed'
                          ? 'text-red-400'
                          : 'text-gray-300'
                  }`}
                >
                  {WORKER_DISPLAY[vote.worker_name] ?? vote.worker_name}
                  {vote.worker_status === 'writing' && ' — writing...'}
                  {vote.worker_status === 'completed' && (
                    <span className="ml-1 text-emerald-500">✓</span>
                  )}
                  {vote.worker_status === 'failed' && (
                    <span className="ml-1">✗</span>
                  )}
                  {vote.worker_status === 'pending' && ' — waiting'}
                </span>
              </div>
            ))}
          </FusionTickerLine>
        )}

        {/* Step 3: Judging */}
        {(isPast('round_1_generating') || isActive('round_2_judging')) && (
          <FusionTickerLine
            timestamp={formatElapsed(elapsed)}
            icon={<Scale className="h-4 w-4" />}
            label={`Claude is blind-judging all ${workerCount} versions`}
            status={stageStatus('round_2_judging')}
          />
        )}

        {/* Step 4: Fusing */}
        {(isPast('round_2_judging') || isActive('round_3_fusing')) && (
          <FusionTickerLine
            timestamp={formatElapsed(elapsed)}
            icon={<Sparkles className="h-4 w-4" />}
            label="Fusing the best parts into your final output"
            status={stageStatus('round_3_fusing')}
          />
        )}

        {/* Step 5: Done */}
        {isComplete && (
          <FusionTickerLine
            timestamp={formatElapsed(session?.duration_ms ?? elapsed)}
            icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
            label="Done"
            status="complete"
          />
        )}

        {/* Failed state */}
        {isFailed && (
          <FusionTickerLine
            timestamp={formatElapsed(elapsed)}
            icon={<AlertCircle className="h-4 w-4 text-red-500" />}
            label={
              ((session?.final_output_metadata as Record<string, unknown> | null)
                ?.error as string) ?? 'Fusion encountered an error'
            }
            status="active"
          />
        )}
      </div>

      {/* Result card when complete */}
      {isComplete && finalOutput && (
        <FusionResultCard
          finalOutput={finalOutput}
          winnerWorker={
            (session?.final_output_metadata as Record<string, unknown> | null)
              ?.winner_worker as string | undefined
          }
          totalCostUsd={session?.total_cost_usd}
          durationMs={session?.duration_ms ?? undefined}
          workerCount={workerCount}
        />
      )}
    </div>
  );
}
