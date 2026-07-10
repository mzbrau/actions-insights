import type { BranchType } from '../models';
import { repositoryKeyFromName } from '../models';

export interface PublishRunContext {
  repository: string;
  repositoryUrl: string;
  workflow: string;
  workflowUrl: string;
  jobUrl?: string;
  runId: number;
  branch: string;
  ref: string;
  tag?: string;
  prNumber?: number;
  prUrl?: string;
  baseBranch?: string;
  commitSha: string;
  commitShortSha: string;
  commitMessage: string;
  commitUrl: string;
  author: string;
  actor: string;
  startedAt: string;
  completedAt: string;
}

export interface PublishTestCase {
  name: string;
  fullName: string;
  outcome: 'passed' | 'failed' | 'skipped' | 'inconclusive';
  durationMs: number;
  assembly?: string;
  namespace?: string;
  className?: string;
  method?: string;
  message?: string;
  stackTrace?: string;
  stdout?: string;
  stderr?: string;
  isNewFailure?: boolean;
}

import type { CoverageReport } from '../models';

export interface PublishTestRun {
  id: string;
  status: 'passed' | 'failed';
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    inconclusive: number;
    durationMs: number;
    successRate: number;
  };
  tests: PublishTestCase[];
  context: PublishRunContext;
  coverage?: CoverageReport;
}

export function sanitizeBranchKey(branch: string): string {
  return branch.replace(/[^a-zA-Z0-9._/-]/g, '-');
}

export function resolveBranchKey(context: PublishRunContext): {
  branchKey: string;
  branchLabel: string;
  branchType: BranchType;
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
  const safeBranch = sanitizeBranchKey(context.branch);
  return {
    branchKey: safeBranch,
    branchLabel: context.branch,
    branchType: 'branch',
  };
}

export function resolveRepositoryKey(repositoryName: string): string {
  return repositoryKeyFromName(repositoryName);
}

export function formatRunFileName(date: string, runId: string): string {
  const iso = date.replace(/[:.]/g, '-').replace(/\.\d{3}Z$/, 'Z');
  return `${iso}-${runId}.json`;
}

export interface HistoryPaths {
  dataRoot: string;
  repositoriesIndex: string;
  configFile: string;
  repoDir: string;
  metadata: string;
  branchesIndex: string;
  branchDir: string;
  branchLatest: string;
  branchHistory: string;
  branchRunsDir: string;
  runFile: string;
  runFileName: string;
  coverageFile?: string;
  coverageFileName?: string;
  testsFile: string;
  prDir?: string;
}

export function resolveHistoryPaths(
  dataPath: string,
  repositoryKey: string,
  branchKey: string,
  runFileName: string,
  prNumber?: number,
): HistoryPaths {
  const dataRoot = dataPath.replace(/\/+$/, '');
  const repoDir = `${dataRoot}/repositories/${repositoryKey}`;
  const branchDir = `${repoDir}/branches/${branchKey}`;
  const runFile = `${branchDir}/runs/${runFileName}`;
  const coverageFileName = runFileName.replace(/\.json$/, '.coverage.json');
  const paths: HistoryPaths = {
    dataRoot,
    repositoriesIndex: `${dataRoot}/repositories.json`,
    configFile: 'config.json',
    repoDir,
    metadata: `${repoDir}/metadata.json`,
    branchesIndex: `${repoDir}/branches.json`,
    branchDir,
    branchLatest: `${branchDir}/latest.json`,
    branchHistory: `${branchDir}/history.json`,
    branchRunsDir: `${branchDir}/runs`,
    runFile,
    runFileName,
    coverageFile: `${branchDir}/runs/${coverageFileName}`,
    coverageFileName,
    testsFile: `${repoDir}/tests.json`,
  };
  if (prNumber) {
    paths.prDir = `${repoDir}/pull-requests/${prNumber}`;
  }
  return paths;
}
