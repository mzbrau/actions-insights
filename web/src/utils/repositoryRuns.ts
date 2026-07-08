import type { BranchType, RunSummary } from '@actions-insights/history-models';
import { loadBranchHistory, loadBranchesIndex } from '../data/loader';

export interface EnrichedRun extends RunSummary {
  branchKey: string;
  branchLabel: string;
  branchType: BranchType;
}

export async function loadRepositoryRuns(
  repoKey: string,
  branchFilter?: string,
): Promise<EnrichedRun[]> {
  const { branches } = await loadBranchesIndex(repoKey);
  const targets = branchFilter
    ? branches.filter((b) => b.key === branchFilter)
    : branches;

  const histories = await Promise.all(
    targets.map(async (branch) => {
      try {
        const history = await loadBranchHistory(repoKey, branch.key);
        return { branch, history };
      } catch {
        return { branch, history: null };
      }
    }),
  );

  const runs: EnrichedRun[] = [];
  for (const { branch, history } of histories) {
    if (!history) continue;
    for (const run of history.runs) {
      runs.push({
        ...run,
        branchKey: branch.key,
        branchLabel: history.branchLabel,
        branchType: branch.type,
      });
    }
  }

  return runs.sort((a, b) => b.date.localeCompare(a.date));
}

export function computeRunMetrics(runs: EnrichedRun[]) {
  if (runs.length === 0) {
    return { total: 0, passed: 0, failed: 0, passRate: 0, failRate: 0, avgDurationMs: 0 };
  }

  const passed = runs.filter((r) => r.status === 'passed').length;
  const failed = runs.filter((r) => r.status === 'failed').length;
  const total = runs.length;
  const avgDurationMs = Math.round(
    runs.reduce((sum, r) => sum + r.durationMs, 0) / total,
  );

  return {
    total,
    passed,
    failed,
    passRate: Math.round((passed / total) * 1000) / 10,
    failRate: Math.round((failed / total) * 1000) / 10,
    avgDurationMs,
  };
}
