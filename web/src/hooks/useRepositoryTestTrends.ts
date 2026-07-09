import { useEffect, useState } from 'react';
import { loadRepositoryTests } from '../data/loader';
import type { TestHistoryEntry } from '@actions-insights/history-models';

export function useRepositoryTestTrends(repoKey: string | undefined) {
  const [trends, setTrends] = useState<Record<string, TestHistoryEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repoKey) {
      setTrends(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await loadRepositoryTests(repoKey);
        if (!cancelled) setTrends(data);
      } catch {
        if (!cancelled) setTrends(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [repoKey]);

  return { trends, loading };
}
