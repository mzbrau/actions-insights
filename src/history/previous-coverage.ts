import type { CoverageSummaryCompact } from '../model/coverage';
import type { CanonicalHistory } from '../model/manifest';
import { readLatestRunFromCanonical, readPreviousRunFromCanonical } from './trends-store';

export interface PreviousCoverageRun {
  commitSha: string;
  commitShortSha: string;
  summary: CoverageSummaryCompact;
}

function findCoverageByCommit(
  history: CanonicalHistory,
  branchKey: string,
  commitSha: string,
): CoverageSummaryCompact | undefined {
  const entry = history.runs.runs.find((r) => r.branchKey === branchKey && r.commitSha === commitSha);
  return entry?.coverage;
}

export function readPreviousCoverageFromCanonical(
  history: CanonicalHistory,
  branchKey: string,
  currentRunId: string,
): PreviousCoverageRun | undefined {
  const branchRuns = history.runs.runs.filter((r) => r.branchKey === branchKey);
  const currentIdx = branchRuns.findIndex((r) => r.runId === currentRunId);
  const searchFrom = currentIdx >= 0 ? currentIdx + 1 : 0;

  for (let i = searchFrom; i < branchRuns.length; i += 1) {
    const run = branchRuns[i];
    if (run.coverage) {
      return {
        commitSha: run.commitSha,
        commitShortSha: run.commitShortSha,
        summary: run.coverage,
      };
    }
  }
  return undefined;
}

export function readBaseBranchCoverageFromCanonical(
  history: CanonicalHistory,
  baseBranchKey: string,
): PreviousCoverageRun | undefined {
  const branchRuns = history.runs.runs.filter((r) => r.branchKey === baseBranchKey);
  for (const run of branchRuns) {
    if (run.coverage) {
      return {
        commitSha: run.commitSha,
        commitShortSha: run.commitShortSha,
        summary: run.coverage,
      };
    }
  }
  return undefined;
}

export function readCoverageForPreviousRun(
  history: CanonicalHistory,
  branchKey: string,
  currentRunId: string,
): PreviousCoverageRun | undefined {
  const previous = readPreviousRunFromCanonical(history, branchKey, currentRunId);
  if (!previous) return undefined;
  const coverage = findCoverageByCommit(history, branchKey, previous.commitSha);
  if (!coverage) return readPreviousCoverageFromCanonical(history, branchKey, currentRunId);
  return {
    commitSha: previous.commitSha,
    commitShortSha: previous.commitShortSha,
    summary: coverage,
  };
}
