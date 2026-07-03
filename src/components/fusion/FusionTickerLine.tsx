'use client';

// =============================================================================
// Component — FusionTickerLine
// A single line in the fusion progress ticker.
// =============================================================================

import type { ReactNode } from 'react';

/** Status variants for a ticker line. */
type LineStatus = 'active' | 'complete' | 'pending';

interface FusionTickerLineProps {
  /** Elapsed time string, e.g. "1.2s" */
  timestamp: string;
  /** Lucide icon or emoji for the step */
  icon: ReactNode;
  /** Label text for this step */
  label: string;
  /** Visual status of this step */
  status: LineStatus;
  /** Optional nested lines (worker sub-statuses) */
  children?: ReactNode;
}

/** Style maps for each status. */
const STATUS_STYLES: Record<LineStatus, string> = {
  active:   'text-[#4F46E5] font-medium',
  complete: 'text-gray-500',
  pending:  'text-gray-300',
};

/**
 * A single progress step in the AI Fusion ticker.
 * Animates in with a fade-slide, pulses when active.
 */
export default function FusionTickerLine({
  timestamp,
  icon,
  label,
  status,
  children,
}: FusionTickerLineProps) {
  return (
    <div
      className="animate-[fadeSlideIn_0.35s_ease-out_both]"
      style={{ animationFillMode: 'both' }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 py-1.5">
        {/* Timestamp */}
        <span className="w-14 shrink-0 text-right font-mono text-xs text-gray-400 tabular-nums">
          {timestamp}
        </span>

        {/* Icon */}
        <span
          className={`shrink-0 text-sm ${
            status === 'active' ? 'animate-pulse' : ''
          } ${STATUS_STYLES[status]}`}
        >
          {icon}
        </span>

        {/* Label */}
        <span className={`text-sm ${STATUS_STYLES[status]}`}>
          {label}
          {status === 'complete' && (
            <span className="ml-1.5 text-emerald-500">✓</span>
          )}
        </span>

        {/* Active dot */}
        {status === 'active' && (
          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#4F46E5] animate-pulse" />
        )}
      </div>

      {/* Nested children (worker sub-lines) */}
      {children && (
        <div className="ml-[4.75rem] space-y-0.5 pb-1">
          {children}
        </div>
      )}
    </div>
  );
}
