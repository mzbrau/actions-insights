import type {
  BranchHistory,
  BranchIndexEntry,
  BranchLatest,
  BranchesIndex,
  HistoryRepoConfig,
  RepositoriesIndex,
  RepositoryIndexEntry,
  RepositoryMetadata,
  RepositoryTestsFile,
  RunRecord,
  RunSummary,
  TestHistoryEntry,
  TestHistoryPoint,
} from '../models';
import {
  HISTORY_SCHEMA_VERSION,
  OUTCOME_TO_CODE,
  decodeRepositoryTestsFile,
  encodeCoverageRunRecord,
  encodeRepositoryTestsFile,
  encodeRunFailures,
  encodeRunTests,
  toCoverageSummaryCompact,
} from '../models';
import {
  formatRunFileName,
  resolveBranchKey,
  resolveHistoryPaths,
  resolveRepositoryKey,
  type HistoryPaths,
  type PublishTestRun,
} from './paths';
import { pruneBranchHistory } from './retention';

export interface ExistingHistoryState {
  repositoriesIndex?: RepositoriesIndex;
  repoConfig?: HistoryRepoConfig;
  metadata?: RepositoryMetadata;
  branchesIndex?: BranchesIndex;
  branchHistory?: BranchHistory;
  branchLatest?: BranchLatest;
  repositoryTests?: RepositoryTestsFile;
}

export interface HistoryFileWrite {
  path: string;
  content: unknown;
}

export interface HistoryUpdateResult {
  repositoryKey: string;
  branchKey: string;
  runId: string;
  runFileName: string;
  paths: HistoryPaths;
  files: HistoryFileWrite[];
  commitPaths: string[];
}

export interface BuildHistoryUpdateOptions {
  dataPath: string;
  repositoryName: string;
  defaultRepository?: string;
  historyLimit: number;
  retainDays: number;
  existing: ExistingHistoryState;
}

export function buildHistoryUpdate(
  run: PublishTestRun,
  options: BuildHistoryUpdateOptions,
): HistoryUpdateResult {
  const repositoryKey = resolveRepositoryKey(options.repositoryName);
  const { branchKey, branchLabel, branchType } = resolveBranchKey(run.context);
  const runDate = run.context.completedAt || new Date().toISOString();
  const runFileName = formatRunFileName(runDate, run.id);
  const paths = resolveHistoryPaths(
    options.dataPath,
    repositoryKey,
    branchKey,
    runFileName,
    run.context.prNumber,
  );

  const runRecord = buildRunRecord(run, branchKey, branchLabel, branchType, runFileName);
  const runSummary = buildRunSummary(run, runFileName, paths.coverageFileName);

  const branchHistory = updateBranchHistory(
    options.existing.branchHistory,
    branchKey,
    branchLabel,
    runSummary,
    { historyLimit: options.historyLimit, retainDays: options.retainDays },
  );

  const branchLatest = buildBranchLatest(run, runFileName, paths.coverageFileName);
  const branchesIndex = updateBranchesIndex(
    options.existing.branchesIndex,
    branchKey,
    branchLabel,
    branchType,
    run,
    branchHistory.runs.length,
  );
  const metadata = updateRepositoryMetadata(
    options.existing.metadata,
    repositoryKey,
    options.repositoryName,
    run.context.repositoryUrl,
    run,
    branchesIndex.branches.length,
  );
  const repositoriesIndex = updateRepositoriesIndex(
    options.existing.repositoriesIndex,
    metadata,
  );
  const repoConfig = updateRepoConfig(options.existing.repoConfig, options.defaultRepository);

  const repositoryTests = updateRepositoryTests(
    options.existing.repositoryTests,
    run,
    branchKey,
    branchLabel,
    branchHistory,
    options.retainDays,
  );

  const files: HistoryFileWrite[] = [
    { path: paths.repositoriesIndex, content: repositoriesIndex },
    { path: paths.metadata, content: metadata },
    { path: paths.branchesIndex, content: branchesIndex },
    { path: paths.branchLatest, content: branchLatest },
    { path: paths.branchHistory, content: branchHistory },
    { path: paths.runFile, content: runRecord },
    { path: paths.testsFile, content: repositoryTests },
  ];

  if (run.coverage && paths.coverageFile) {
    const coverageRecord = encodeCoverageRunRecord(run.id, run.coverage);
    files.push({ path: paths.coverageFile, content: coverageRecord });
  }

  if (repoConfig) {
    files.push({ path: paths.configFile, content: repoConfig });
  }

  const commitPaths = [
    paths.repositoriesIndex,
    paths.metadata,
    paths.branchesIndex,
    paths.branchLatest,
    paths.branchHistory,
    paths.runFile,
    paths.testsFile,
  ];
  if (run.coverage && paths.coverageFile) {
    commitPaths.push(paths.coverageFile);
  }
  if (repoConfig) {
    commitPaths.push(paths.configFile);
  }

  return {
    repositoryKey,
    branchKey,
    runId: run.id,
    runFileName,
    paths,
    files,
    commitPaths,
  };
}

function buildRunRecord(
  run: PublishTestRun,
  branchKey: string,
  branchLabel: string,
  branchType: 'branch' | 'pr' | 'tag',
  runFileName: string,
): RunRecord {
  const encodedTests = encodeRunTests(
    run.tests.map((t) => ({
      fullName: t.fullName,
      outcomeCode: OUTCOME_TO_CODE[t.outcome],
      durationMs: t.durationMs,
      namespace: t.namespace,
      className: t.className,
      method: t.method,
      assembly: t.assembly,
      stackTrace: t.stackTrace,
      isNewFailure: t.isNewFailure,
    })),
  );

  const failures = encodeRunFailures(
    run.tests
      .map((t, index) => ({ test: t, index }))
      .filter(({ test }) => test.outcome === 'failed')
      .map(({ test, index }) => ({
        testIndex: index,
        message: test.message,
        stackTrace: test.stackTrace,
        stdout: test.stdout,
        stderr: test.stderr,
      })),
  );

  return {
    version: HISTORY_SCHEMA_VERSION,
    runId: run.id,
    workflowRunId: run.context.runId,
    status: run.status,
    date: run.context.completedAt,
    durationMs: run.stats.durationMs,
    context: {
      repository: run.context.repository,
      repositoryUrl: run.context.repositoryUrl,
      workflow: run.context.workflow,
      branch: run.context.branch,
      branchKey,
      branchLabel,
      branchType,
      ref: run.context.ref,
      tag: run.context.tag,
      prNumber: run.context.prNumber,
      prUrl: run.context.prUrl,
      baseBranch: run.context.baseBranch,
      commitSha: run.context.commitSha,
      commitShortSha: run.context.commitShortSha,
      commitMessage: run.context.commitMessage,
      commitUrl: run.context.commitUrl,
      author: run.context.author,
      actor: run.context.actor,
      startedAt: run.context.startedAt,
      completedAt: run.context.completedAt,
    },
    stats: { ...run.stats },
    ...(encodedTests.classes ? { classes: encodedTests.classes } : {}),
    tests: encodedTests.tests,
    failures,
    links: {
      workflowUrl: run.context.workflowUrl,
      commitUrl: run.context.commitUrl,
      prUrl: run.context.prUrl,
      jobUrl: run.context.jobUrl,
    },
  };
}

function buildRunSummary(run: PublishTestRun, runFileName: string, coverageFileName?: string): RunSummary {
  const summary: RunSummary = {
    runId: run.id,
    workflowRunId: run.context.runId,
    status: run.status,
    date: run.context.completedAt,
    durationMs: run.stats.durationMs,
    total: run.stats.total,
    passed: run.stats.passed,
    failed: run.stats.failed,
    skipped: run.stats.skipped,
    commitSha: run.context.commitSha,
    commitShortSha: run.context.commitShortSha,
    commitMessage: run.context.commitMessage,
    author: run.context.author,
    runFile: runFileName,
  };
  if (run.coverage) {
    summary.coverage = toCoverageSummaryCompact(run.coverage);
    if (coverageFileName) summary.coverageFile = coverageFileName;
  }
  return summary;
}

function buildBranchLatest(run: PublishTestRun, runFileName: string, coverageFileName?: string): BranchLatest {
  const latest: BranchLatest = {
    version: HISTORY_SCHEMA_VERSION,
    runId: run.id,
    runFile: runFileName,
    status: run.status,
    date: run.context.completedAt,
    durationMs: run.stats.durationMs,
    commitSha: run.context.commitSha,
    commitShortSha: run.context.commitShortSha,
    commitMessage: run.context.commitMessage,
    author: run.context.author,
    total: run.stats.total,
    passed: run.stats.passed,
    failed: run.stats.failed,
    skipped: run.stats.skipped,
  };
  if (run.coverage) {
    latest.coverage = toCoverageSummaryCompact(run.coverage);
    if (coverageFileName) latest.coverageFile = coverageFileName;
  }
  return latest;
}

function updateBranchHistory(
  existing: BranchHistory | undefined,
  branchKey: string,
  branchLabel: string,
  summary: RunSummary,
  retention: { historyLimit: number; retainDays: number },
): BranchHistory {
  const runs = existing?.runs.filter((r) => r.runId !== summary.runId) ?? [];
  runs.unshift(summary);
  const history: BranchHistory = {
    version: HISTORY_SCHEMA_VERSION,
    branchKey,
    branchLabel,
    updatedAt: new Date().toISOString(),
    runs,
  };
  return pruneBranchHistory(history, retention);
}

function updateBranchesIndex(
  existing: BranchesIndex | undefined,
  branchKey: string,
  branchLabel: string,
  branchType: 'branch' | 'pr' | 'tag',
  run: PublishTestRun,
  runCount: number,
): BranchesIndex {
  const entry: BranchIndexEntry = {
    key: branchKey,
    label: branchLabel,
    type: branchType,
    latestStatus: run.status,
    latestDate: run.context.completedAt,
    latestDurationMs: run.stats.durationMs,
    latestCommitShortSha: run.context.commitShortSha,
    latestAuthor: run.context.author,
    runCount,
  };

  const branches = (existing?.branches ?? []).filter((b) => b.key !== branchKey);
  branches.push(entry);
  branches.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

  return {
    version: HISTORY_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    branches,
  };
}

function updateRepositoryMetadata(
  existing: RepositoryMetadata | undefined,
  key: string,
  name: string,
  url: string,
  run: PublishTestRun,
  branchCount: number,
): RepositoryMetadata {
  return {
    version: HISTORY_SCHEMA_VERSION,
    key,
    name,
    url,
    updatedAt: new Date().toISOString(),
    latestStatus: run.status,
    branchCount,
    lastRunDate: run.context.completedAt,
    latestCommitShortSha: run.context.commitShortSha,
  };
}

function updateRepositoriesIndex(
  existing: RepositoriesIndex | undefined,
  metadata: RepositoryMetadata,
): RepositoriesIndex {
  const entry: RepositoryIndexEntry = {
    key: metadata.key,
    name: metadata.name,
    url: metadata.url,
    latestStatus: metadata.latestStatus,
    branchCount: metadata.branchCount,
    lastUpdated: metadata.updatedAt,
    latestCommitShortSha: metadata.latestCommitShortSha,
  };

  const repositories = (existing?.repositories ?? []).filter((r) => r.key !== entry.key);
  repositories.push(entry);
  repositories.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return {
    version: HISTORY_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    repositories,
  };
}

function updateRepoConfig(
  existing: HistoryRepoConfig | undefined,
  defaultRepository?: string,
): HistoryRepoConfig | undefined {
  if (existing?.defaultRepository || !defaultRepository) {
    return existing;
  }
  return { defaultRepository };
}

function computeTestPassRate(points: TestHistoryPoint[]): { passRate: number; runCount: number } {
  const counted = points.filter((p) => p.o === 0 || p.o === 1);
  const runCount = counted.length;
  if (runCount === 0) return { passRate: 0, runCount: 0 };
  const passed = counted.filter((p) => p.o === 0).length;
  return { passRate: Math.round((passed / runCount) * 1000) / 10, runCount };
}

function dedupeTestPoints(points: TestHistoryPoint[]): TestHistoryPoint[] {
  const seen = new Set<string>();
  const result: TestHistoryPoint[] = [];
  for (const point of points) {
    const key = `${point.runId}:${point.branchKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(point);
  }
  return result;
}

function updateRepositoryTests(
  existing: RepositoryTestsFile | undefined,
  run: PublishTestRun,
  branchKey: string,
  branchLabel: string,
  branchHistory: BranchHistory,
  retainDays: number,
): RepositoryTestsFile {
  const retainedRunIds = new Set(branchHistory.runs.map((r) => r.runId));
  const cutoff = Date.now() - retainDays * 24 * 60 * 60 * 1000;
  const existingTests = existing ? decodeRepositoryTestsFile(existing) : {};
  const tests: Record<string, TestHistoryEntry> = {};

  for (const [name, entry] of Object.entries(existingTests)) {
    const filtered = entry.points.filter((p) => {
      if (new Date(p.date).getTime() < cutoff) return false;
      if (p.branchKey === branchKey && !retainedRunIds.has(p.runId)) return false;
      return true;
    });
    if (filtered.length > 0) {
      const points = dedupeTestPoints(filtered).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      tests[name] = { ...computeTestPassRate(points), points };
    }
  }

  for (const test of run.tests) {
    const point: TestHistoryPoint = {
      runId: run.id,
      date: run.context.completedAt,
      o: OUTCOME_TO_CODE[test.outcome],
      d: test.durationMs,
      commitShortSha: run.context.commitShortSha,
      branchKey,
      branchLabel,
    };

    const existingPoints = tests[test.fullName]?.points ?? [];
    const withoutRun = existingPoints.filter(
      (p) => !(p.runId === run.id && p.branchKey === branchKey),
    );
    const points = dedupeTestPoints([point, ...withoutRun]).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    tests[test.fullName] = { ...computeTestPassRate(points), points };
  }

  return encodeRepositoryTestsFile(tests, existing, new Date().toISOString());
}

export function createEmptyRepositoriesIndex(): RepositoriesIndex {
  return {
    version: HISTORY_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    repositories: [],
  };
}
