'use client';

// =============================================================================
// Hook — useFusionSession
// Subscribes to Supabase Realtime for live AI Fusion status updates.
// Falls back to polling if no realtime updates are received.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AiPanelSession, AiPanelVote } from '@/lib/ai-panel/types';

/** Return shape of the useFusionSession hook. */
export interface UseFusionSessionReturn {
  session: AiPanelSession | null;
  votes: AiPanelVote[];
  isLoading: boolean;
  isComplete: boolean;
  isFailed: boolean;
  finalOutput: string | null;
  error: string | null;
}

/**
 * Subscribe to Supabase Realtime for live AI Fusion progress updates.
 *
 * Automatically polls `/api/fusion/status/[sessionId]` as a fallback
 * if no realtime updates arrive within 10 seconds.
 *
 * @param sessionId - The session to subscribe to, or `null` when idle.
 * @returns Live session state, votes, and derived flags.
 */
export function useFusionSession(sessionId: string | null): UseFusionSessionReturn {
  const [session, setSession] = useState<AiPanelSession | null>(null);
  const [votes, setVotes] = useState<AiPanelVote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track last realtime update time for fallback polling
  const lastRealtimeUpdate = useRef<number>(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Fetch current session state from the REST API.
   */
  const fetchStatus = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/fusion/status/${sid}`);
      if (!res.ok) {
        const data = await res.json();
        setError((data as { error: string }).error ?? 'Failed to fetch status');
        return;
      }
      const data = await res.json();
      setSession(data.session as AiPanelSession);
      setVotes(data.votes as AiPanelVote[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setVotes([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    lastRealtimeUpdate.current = Date.now();

    const supabase = createClient();

    // Initial fetch
    fetchStatus(sessionId).then(() => setIsLoading(false));

    // Subscribe to realtime
    const channel = supabase
      .channel(`fusion:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_panel_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          lastRealtimeUpdate.current = Date.now();
          setSession(payload.new as AiPanelSession);
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_panel_votes',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          lastRealtimeUpdate.current = Date.now();
          const newVote = payload.new as AiPanelVote;
          setVotes((prev) => {
            const idx = prev.findIndex((v) => v.id === newVote.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = newVote;
              return next;
            }
            return [...prev, newVote];
          });
        },
      )
      .subscribe();

    // Fallback polling: if no realtime update for 10s, poll every 3s
    pollingRef.current = setInterval(() => {
      const elapsed = Date.now() - lastRealtimeUpdate.current;
      if (elapsed > 10_000) {
        fetchStatus(sessionId);
      }
    }, 3_000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId, fetchStatus]);

  // Stop polling once session reaches a terminal state
  useEffect(() => {
    if (
      session?.status === 'completed' ||
      session?.status === 'failed'
    ) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [session?.status]);

  return {
    session,
    votes,
    isLoading,
    isComplete: session?.status === 'completed',
    isFailed: session?.status === 'failed',
    finalOutput: session?.final_output ?? null,
    error,
  };
}
