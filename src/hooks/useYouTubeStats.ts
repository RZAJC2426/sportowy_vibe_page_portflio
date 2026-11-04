import { useState, useEffect, useCallback, useRef } from 'react';
import { invokeEdgeFunction } from '@/lib/supabase';

interface YouTubeStatsRaw {
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  error?: string;
  hint?: string;
  fetchedAt: string;
}

export interface YouTubeStats {
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  loading: boolean;
  error: string | null;
  hint: string | null;
  fetchedAt: string | null;
  refresh: () => void;
}

export function useYouTubeStats(): YouTubeStats {
  const [stats, setStats] = useState<YouTubeStatsRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await invokeEdgeFunction('youtube-channel-stats');
      const parsed = data as YouTubeStatsRaw;
      if (parsed.error) {
        setError(parsed.error);
        setHint(parsed.hint ?? null);
      } else {
        setError(null);
        setHint(null);
      }
      setStats(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      setHint(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStats]);

  return {
    subscriberCount: stats?.subscriberCount ?? 0,
    videoCount: stats?.videoCount ?? 0,
    viewCount: stats?.viewCount ?? 0,
    loading,
    error,
    hint,
    fetchedAt: stats?.fetchedAt ?? null,
    refresh: fetchStats,
  };
}