import type { CoverageMetrics } from '../model/coverage';
import type { PreviousCoverageRun } from '../history/previous-coverage';
import { computeCoverageDelta } from './coverage-stats';

export interface CoverageDeltaContext {
  current?: CoverageMetrics;
  previous?: PreviousCoverageRun;
  baseBranch?: PreviousCoverageRun;
  isPullRequest: boolean;
  baseBranchLabel?: string;
}

export function resolveCoverageComparison(ctx: CoverageDeltaContext): {
  delta: { line?: number; branch?: number };
  vsLabel: string;
} | undefined {
  const { current, previous, baseBranch, isPullRequest, baseBranchLabel } = ctx;
  if (!current) return undefined;

  if (isPullRequest && baseBranch) {
    return {
      delta: computeCoverageDelta(current, baseBranch.summary),
      vsLabel: baseBranchLabel ?? 'main',
    };
  }

  if (previous) {
    return {
      delta: computeCoverageDelta(current, previous.summary),
      vsLabel: 'previous run',
    };
  }

  return undefined;
}
