export const HISTORY_SCHEMA_VERSION = 1 as const;

export type RunStatus = 'passed' | 'failed';
export type BranchType = 'branch' | 'pr' | 'tag';
export type TestOutcome = 'passed' | 'failed' | 'skipped' | 'inconclusive';

export const OUTCOME_TO_CODE: Record<TestOutcome, number> = {
  passed: 0,
  failed: 1,
  skipped: 2,
  inconclusive: 3,
};

export const CODE_TO_OUTCOME: TestOutcome[] = ['passed', 'failed', 'skipped', 'inconclusive'];

export interface HistoryRepoConfig {
  defaultRepository?: string;
}

export interface RepositoryIndexEntry {
  key: string;
  name: string;
  url: string;
  latestStatus: RunStatus;
  branchCount: number;
  lastUpdated: string;
  latestCommitShortSha?: string;
}

export interface RepositoriesIndex {
  version: typeof HISTORY_SCHEMA_VERSION;
  updatedAt: string;
  repositories: RepositoryIndexEntry[];
}

export interface RepositoryMetadata {
  version: typeof HISTORY_SCHEMA_VERSION;
  key: string;
  name: string;
  url: string;
  updatedAt: string;
  latestStatus: RunStatus;
  branchCount: number;
  lastRunDate: string;
  latestCommitShortSha?: string;
}

export interface BranchIndexEntry {
  key: string;
  label: string;
  type: BranchType;
  latestStatus: RunStatus;
  latestDate: string;
  latestDurationMs: number;
  latestCommitShortSha: string;
  latestAuthor: string;
  runCount: number;
}

export interface BranchesIndex {
  version: typeof HISTORY_SCHEMA_VERSION;
  updatedAt: string;
  branches: BranchIndexEntry[];
}

export interface RunSummary {
  runId: string;
  workflowRunId: number;
  status: RunStatus;
  date: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  commitSha: string;
  commitShortSha: string;
  commitMessage: string;
  author: string;
  runFile: string;
}

export interface BranchLatest {
  version: typeof HISTORY_SCHEMA_VERSION;
  runId: string;
  runFile: string;
  status: RunStatus;
  date: string;
  durationMs: number;
  commitSha: string;
  commitShortSha: string;
  commitMessage: string;
  author: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface BranchHistory {
  version: typeof HISTORY_SCHEMA_VERSION;
  branchKey: string;
  branchLabel: string;
  updatedAt: string;
  runs: RunSummary[];
}

export interface CompactTestRecord {
  i: number;
  n: string;
  o: number;
  d: number;
  a?: string;
  ns?: string;
  c?: string;
  m?: string;
  st?: string;
  nf?: boolean;
}

export interface FailureRecord {
  testName: string;
  fullName: string;
  message?: string;
  stackTrace?: string;
  stdout?: string;
  stderr?: string;
}

export interface RunContextRecord {
  repository: string;
  repositoryUrl: string;
  workflow: string;
  branch: string;
  branchKey: string;
  branchLabel: string;
  branchType: BranchType;
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

export interface RunStatsRecord {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  inconclusive: number;
  durationMs: number;
  successRate: number;
}

export interface RunLinks {
  workflowUrl: string;
  commitUrl: string;
  prUrl?: string;
  jobUrl?: string;
}

export interface RunRecord {
  version: typeof HISTORY_SCHEMA_VERSION;
  runId: string;
  workflowRunId: number;
  status: RunStatus;
  date: string;
  durationMs: number;
  context: RunContextRecord;
  stats: RunStatsRecord;
  tests: CompactTestRecord[];
  failures: FailureRecord[];
  links: RunLinks;
  extensions?: Record<string, unknown>;
}

export interface HistoryPublishConfig {
  enabled: boolean;
  repository: string;
  token: string;
  branch: string;
  dataPath: string;
  repositoryName: string;
  mode: 'multi';
  defaultRepository?: string;
  historyLimit: number;
  retainDays: number;
  slowTestThresholdMs: number;
}

export function repositoryKeyFromName(name: string): string {
  return name.replace('/', '.');
}

export function repositoryNameFromKey(key: string): string {
  const dot = key.indexOf('.');
  if (dot < 0) return key;
  return `${key.slice(0, dot)}/${key.slice(dot + 1)}`;
}
