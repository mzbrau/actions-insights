import type { RunContext } from '../model/test-run';

export interface ReportPaths {
  branchKey: string;
  branchLabel: string;
  branchType: 'branch' | 'pr' | 'tag';
  runDirName: string;
  branchDir: string;
  runDir: string;
  latestDir: string;
  relativeReportUrl: string;
  relativeBranchUrl: string;
  relativeLatestUrl: string;
}

export function resolveReportPaths(
  context: RunContext,
  pagesSubdirectory: string,
): ReportPaths {
  const { branchKey, branchLabel, branchType } = resolveBranchKey(context);
  const runDirName = `run-${context.runId}`;
  const branchDir = `${pagesSubdirectory}/${branchKey}`;
  const runDir = `${branchDir}/${runDirName}`;
  const latestDir = `${branchDir}/latest`;

  return {
    branchKey,
    branchLabel,
    branchType,
    runDirName,
    branchDir,
    runDir,
    latestDir,
    relativeReportUrl: `${latestDir}/index.html`,
    relativeBranchUrl: `${branchDir}/index.html`,
    relativeLatestUrl: `${latestDir}/`,
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

export function buildReportUrl(pagesBaseUrl: string | undefined, relativePath: string): string | undefined {
  if (!pagesBaseUrl) return undefined;
  return `${pagesBaseUrl}/${relativePath}`.replace(/([^:]\/)\/+/g, '$1');
}

export function cacheKey(owner: string, repo: string): string {
  return `actions-insights-pages-site-${owner}-${repo}`;
}
