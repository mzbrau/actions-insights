import type { RunContext } from '../model/test-run';

export interface ReportPaths {
  branchKey: string;
  branchLabel: string;
  branchType: 'branch' | 'pr' | 'tag';
  branchDir: string;
  historyDir: string;
  artifactDir: string;
  partialRunPath: string;
  relativeReportUrl: string;
}

export function resolveReportPaths(
  context: RunContext,
  reportsSubdirectory: string,
): ReportPaths {
  const { branchKey, branchLabel, branchType } = resolveBranchKey(context);
  const branchDir = `${reportsSubdirectory}/${branchKey}`;
  const historyDir = `${reportsSubdirectory}/.history`;
  const artifactDir = reportsSubdirectory;

  return {
    branchKey,
    branchLabel,
    branchType,
    branchDir,
    historyDir,
    artifactDir,
    partialRunPath: `${branchDir}/partial-${context.runId}.json`,
    relativeReportUrl: `${artifactDir}/report.html`,
  };
}

export function resolveBranchKey(context: RunContext): {
  branchKey: string;
  branchLabel: string;
  branchType: 'branch' | 'pr' | 'tag';
} {
  if (context.prNumber) {
    return {
      branchKey: `pr-${context.prNumber}`,
      branchLabel: `PR #${context.prNumber}`,
      branchType: 'pr',
    };
  }
  if (context.tag) {
    const safeTag = context.tag.replace(/[^a-zA-Z0-9._-]/g, '-');
    return {
      branchKey: `release-${safeTag}`,
      branchLabel: context.tag,
      branchType: 'tag',
    };
  }
  const safeBranch = context.branch.replace(/[^a-zA-Z0-9._/-]/g, '-');
  return {
    branchKey: safeBranch,
    branchLabel: context.branch,
    branchType: 'branch',
  };
}

export function cacheKey(owner: string, repo: string): string {
  return `actions-insights-site-${owner}-${repo}`;
}
