import { useEffect, useState } from 'react';
import { computeRunMetrics, loadRepositoryRuns, type EnrichedRun } from '../utils/repositoryRuns';

export function useRepositoryRuns(repoKey: string | undefined, branchFilter?: string) {
  const [runs, setRuns] = useState<EnrichedRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoKey) {
      setRuns([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await loadRepositoryRuns(repoKey, branchFilter || undefined);
        if (!cancelled) setRuns(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [repoKey, branchFilter]);

  const metrics = computeRunMetrics(runs);

  return { runs, metrics, loading, error };
}
