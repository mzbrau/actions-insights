import type { BranchHistory, RunSummary } from '../models';

export interface RetentionOptions {
  historyLimit: number;
  retainDays: number;
}

export function pruneBranchHistory(
  history: BranchHistory,
  options: RetentionOptions,
): BranchHistory {
  const cutoff = Date.now() - options.retainDays * 24 * 60 * 60 * 1000;
  const sorted = [...history.runs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const kept: RunSummary[] = [];
  for (const run of sorted) {
    if (kept.length >= options.historyLimit) break;
    if (new Date(run.date).getTime() < cutoff) continue;
    kept.push(run);
  }

  return {
    ...history,
    runs: kept.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    updatedAt: new Date().toISOString(),
  };
}

export function listOrphanedRunFiles(
  history: BranchHistory,
  existingRunFiles: string[],
): string[] {
  const referenced = new Set(history.runs.map((r) => r.runFile));
  return existingRunFiles.filter((f) => !referenced.has(f));
}
