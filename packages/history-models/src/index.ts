export const HISTORY_SCHEMA_VERSION = 2 as const;

import type { CoverageSummaryCompact } from './coverage';
import type { DiagnosticSummaryCompact } from './diagnostics';
import type { TimingSummaryCompact } from './timing';

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
  coverage?: CoverageSummaryCompact;
  coverageFile?: string;
  diagnostics?: DiagnosticSummaryCompact;
  diagnosticsFile?: string;
  timing?: TimingSummaryCompact;
  timingFile?: string;
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
  coverage?: CoverageSummaryCompact;
  coverageFile?: string;
  diagnostics?: DiagnosticSummaryCompact;
  diagnosticsFile?: string;
  timing?: TimingSummaryCompact;
  timingFile?: string;
}

export interface BranchHistory {
  version: typeof HISTORY_SCHEMA_VERSION;
  branchKey: string;
  branchLabel: string;
  updatedAt: string;
  runs: RunSummary[];
}

/** Expanded test record used by the web UI after normalization. */
export interface CompactTestRecord {
  i?: number;
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

/** On-disk compact test record in run files (schema v2). */
export interface StoredTestRecord {
  c?: number;
  m?: string;
  n?: string;
  o: number;
  d: number;
  a?: string;
  st?: string;
  nf?: boolean;
}

/** On-disk compact failure record in run files (schema v2). */
export interface CompactFailureRecord {
  t: number;
  message?: string;
  stackTrace?: string;
  stdout?: string;
  stderr?: string;
}

/** Expanded failure record used by the web UI after normalization. */
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
  classes?: string[];
  tests: StoredTestRecord[];
  failures: CompactFailureRecord[];
  links: RunLinks;
  extensions?: Record<string, unknown>;
}

export interface TestHistoryPoint {
  runId: string;
  date: string;
  o: number;
  d: number;
  commitShortSha: string;
  branchKey: string;
  branchLabel: string;
}

export interface TestHistoryEntry {
  passRate: number;
  runCount: number;
  points: TestHistoryPoint[];
}

export interface RepositoryTestsFile {
  version: typeof HISTORY_SCHEMA_VERSION;
  updatedAt: string;
  names: string[];
  entries: Record<string, TestHistoryEntry>;
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

export {
  decodeRepositoryTestsFile,
  deriveClassNameFromCompactRecord,
  deriveQualifiedClassName,
  encodeRepositoryTestsFile,
  encodeRunFailures,
  encodeRunTests,
  expandRunFailures,
  expandRunTests,
  normalizeMethodName,
  normalizeRunRecord,
  normalizeTestsFile,
  resolveTestFullName,
} from './encoding';
export type {
  EncodeFailureInput,
  EncodeTestInput,
  NormalizedRunRecord,
} from './encoding';

export type {
  CoverageClass,
  CoverageFile,
  CoverageMetrics,
  CoveragePackage,
  CoverageParseError,
  CoverageProject,
  CoverageReport,
  CoverageRunRecord,
  CoverageSummary,
  CoverageSummaryCompact,
  CompactCoverageFile,
  CompactCoverageProject,
} from './coverage';

export {
  aggregateMetricsFromProjects,
  decodeCoverageRunRecord,
  encodeCoverageRunRecord,
  mergeMetrics,
  normalizeCoverageRunRecord,
  percentFromCounts,
  toCoverageSummaryCompact,
} from './coverage';

export type {
  CompactDiagnosticItem,
  DiagnosticItem,
  DiagnosticParseError,
  DiagnosticReport,
  DiagnosticRunRecord,
  DiagnosticSeverity,
  DiagnosticSummaryCompact,
  NormalizedDiagnosticItem,
} from './diagnostics';

export {
  CODE_TO_SEVERITY,
  computeDiagnosticSummary,
  encodeDiagnosticRunRecord,
  expandDiagnosticItems,
  MAX_DIAGNOSTICS_PER_RUN,
  normalizeDiagnosticRunRecord,
  SEVERITY_TO_CODE,
} from './diagnostics';

export type {
  TimingRunRecord,
  TimingSummaryCompact,
  WorkflowJobTiming,
  WorkflowRunnerInfo,
  WorkflowStepTiming,
  WorkflowTimingReport,
  WorkflowTimingSummary,
} from './timing';

export {
  durationBetweenMs,
  encodeTimingRunRecord,
  findSlowestStep,
  normalizeTimingRunRecord,
  toTimingSummaryCompact,
} from './timing';
