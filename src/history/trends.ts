import type { RunManifestEntry, TrendData, TrendPoint } from '../model/manifest';
import type { RunStatus } from '../model/test-run';

export function buildTrendData(key: string, runs: RunManifestEntry[]): TrendData {
  const points: TrendPoint[] = [...runs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-20)
    .map((run) => ({
      runId: run.runId,
      date: run.date,
      passed: run.passed,
      failed: run.failed,
      skipped: run.skipped,
      durationMs: run.durationMs,
      status: run.status,
    }));

  const totalRuns = runs.length;
  const averagePassRate =
    totalRuns > 0
      ? Math.round(
          (runs.reduce((sum, r) => sum + (r.total > 0 ? (r.passed / r.total) * 100 : 0), 0) / totalRuns) *
            10,
        ) / 10
      : 0;
  const averageDurationMs =
    totalRuns > 0 ? Math.round(runs.reduce((sum, r) => sum + r.durationMs, 0) / totalRuns) : 0;

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const failuresLast24h = runs.filter(
    (r) => r.status === 'failed' && new Date(r.date).getTime() >= oneDayAgo,
  ).length;

  return {
    key,
    points,
    averagePassRate,
    averageDurationMs,
    failuresLast24h,
    totalRuns,
  };
}

export function detectNewFailures(
  currentFailed: string[],
  previousFailed: string[] | undefined,
): Set<string> {
  if (!previousFailed || previousFailed.length === 0) {
    return new Set();
  }
  const previous = new Set(previousFailed);
  return new Set(currentFailed.filter((name) => !previous.has(name)));
}

export function readPreviousFailedTests(manifestPath: string): string[] | undefined {
  try {
    const fs = require('fs');
    if (!fs.existsSync(manifestPath)) return undefined;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest.failedTests as string[] | undefined;
  } catch {
    return undefined;
  }
}

export function statusFromCounts(failed: number): RunStatus {
  return failed > 0 ? 'failed' : 'passed';
}
