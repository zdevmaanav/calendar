'use client';

// =============================================================================
// Component — FusionResultCard
// Displays the final fused output with metadata and action buttons.
// =============================================================================

import {
  Medal,
  Clock,
  DollarSign,
  Cpu,
  ThumbsUp,
  RefreshCw,
  ThumbsDown,
} from 'lucide-react';

interface FusionResultCardProps {
  /** The fused final output text. */
  finalOutput: string;
  /** Name of the winning worker AI. */
  winnerWorker?: string;
  /** Total USD cost of the fusion run. */
  totalCostUsd?: number;
  /** Total duration in milliseconds. */
  durationMs?: number;
  /** Number of AI workers used. */
  workerCount?: number;
  /** Called when the user approves the output. */
  onApprove?: () => void;
  /** Called when the user rejects the output. */
  onReject?: () => void;
  /** Called when the user wants to regenerate. */
  onRegenerate?: () => void;
}

/** Friendly display names for worker models. */
const WORKER_DISPLAY: Record<string, string> = {
  gemini: 'Gemini',
  gpt4o: 'GPT-4o',
  llama: 'Llama',
  mistral: 'Mistral',
  kimi: 'Kimi',
};

/**
 * Card displaying the completed AI Fusion result.
 * Shows the fused output text, metadata (cost, duration, winner),
 * and optional approve/reject/regenerate actions.
 */
export default function FusionResultCard({
  finalOutput,
  winnerWorker,
  totalCostUsd,
  durationMs,
  workerCount,
  onApprove,
  onReject,
  onRegenerate,
}: FusionResultCardProps) {
  const duration = durationMs ? (durationMs / 1000).toFixed(1) : null;
  const cost = totalCostUsd !== undefined ? totalCostUsd.toFixed(4) : null;
  const workerDisplay = winnerWorker
    ? WORKER_DISPLAY[winnerWorker] ?? winnerWorker
    : null;

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm animate-[fadeSlideIn_0.4s_ease-out_both]">
      {/* Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#4F46E5]">
          <Cpu className="h-3 w-3" />
          Fused output
        </span>
      </div>

      {/* Output text */}
      <div className="mb-5 rounded-lg bg-gray-50/80 p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {finalOutput}
        </p>
      </div>

      {/* Metadata bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-4">
        {workerCount !== undefined && workerCount > 0 && (
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            Powered by {workerCount} AIs
          </span>
        )}
        {duration && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {duration}s
          </span>
        )}
        {cost && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ${cost}
          </span>
        )}
        {workerDisplay && (
          <span className="flex items-center gap-1">
            <Medal className="h-3 w-3 text-amber-400" />
            Winner: {workerDisplay}
          </span>
        )}
      </div>

      {/* Action buttons */}
      {(onApprove || onReject || onRegenerate) && (
        <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
          {onApprove && (
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-600"
            >
              <ThumbsUp className="h-3 w-3" />
              Approve
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <ThumbsDown className="h-3 w-3" />
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
