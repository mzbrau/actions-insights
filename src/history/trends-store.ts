import * as fs from 'fs';
import * as path from 'path';
import type {
  CanonicalHistory,
  CanonicalRunEntry,
  CanonicalRunsFile,
  CanonicalTestsFile,
  RunManifestEntry,
  TestHistoryEntry,
  TestHistoryPoint,
  TrendsFile,
} from '../model/manifest';
import { OUTCOME_TO_CODE } from '../model/manifest';
import type { TestCase } from '../model/test-case';
import type { TestRun } from '../model/test-run';
import { pruneRuns, type RetentionOptions } from './retention';
import { buildTrendData } from './trends';
import type { PreviousRun } from './previous-run';

export const MAIN_BRANCH_KEY = 'main';

const EMPTY_RUNS: CanonicalRunsFile = {
  version: 1,
  repository: '',
  updatedAt: new Date(0).toISOString(),
  runs: [],
};

const EMPTY_TESTS: CanonicalTestsFile = {
  version: 1,
  tests: {},
};

export function historyDir(siteDir: string, reportsSubdirectory: string): string {
  return path.join(siteDir, reportsSubdirectory, '.history');
}

export function readCanonicalHistory(siteDir: string, reportsSubdirectory: string): CanonicalHistory {
  const dir = historyDir(siteDir, reportsSubdirectory);
  const runsPath = path.join(dir, 'runs.json');
  const testsPath = path.join(dir, 'tests.json');

  return {
    runs: readJsonFile<CanonicalRunsFile>(runsPath) ?? { ...EMPTY_RUNS },
    tests: readJsonFile<CanonicalTestsFile>(testsPath) ?? { ...EMPTY_TESTS },
  };
}

export function writeCanonicalHistory(
  siteDir: string,
  reportsSubdirectory: string,
  history: CanonicalHistory,
): void {
  const dir = historyDir(siteDir, reportsSubdirectory);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'runs.json'), JSON.stringify(history.runs, null, 2));
  fs.writeFileSync(path.join(dir, 'tests.json'), JSON.stringify(history.tests, null, 2));
}

function readJsonFile<T>(filePath: string): T | undefined {
  try {
    if (!fs.existsSync(filePath)) return undefined;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return undefined;
  }
}

export function createRunEntry(
  run: TestRun,
  branchKey: string,
  branchLabel: string,
  branchType: CanonicalRunEntry['branchType'],
): CanonicalRunEntry {
  const failedTests = run.tests.filter((t) => t.outcome === 'failed').map((t) => t.fullName);
  return {
    runId: String(run.context.runId),
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
    path: 'report.html',
    isLatest: true,
    branchKey,
    branchLabel,
    branchType,
    failedTests,
    testOutcomes: run.tests.map((t) => ({
      n: t.fullName,
      o: OUTCOME_TO_CODE[t.outcome] ?? 3,
      d: t.durationMs,
    })),
  };
}

export function appendRunToHistory(
  history: CanonicalHistory,
  run: TestRun,
  branchKey: string,
  branchLabel: string,
  branchType: CanonicalRunEntry['branchType'],
): CanonicalHistory {
  const entry = createRunEntry(run, branchKey, branchLabel, branchType);
  const runId = entry.runId;
  const withoutCurrent = history.runs.runs.filter((r) => r.runId !== runId);
  const runs: CanonicalRunsFile = {
    version: 1,
    repository: run.context.repository,
    updatedAt: new Date().toISOString(),
    runs: [entry, ...withoutCurrent],
  };

  const tests: Record<string, TestHistoryPoint[]> = { ...history.tests.tests };

  for (const test of run.tests) {
    const point: TestHistoryPoint = {
      runId,
      date: run.context.completedAt,
      o: OUTCOME_TO_CODE[test.outcome] ?? 3,
      d: test.durationMs,
      commitShortSha: run.context.commitShortSha,
      branchKey,
      branchLabel,
    };

    const existing = tests[test.fullName] ?? [];
    const withoutRun = existing.filter((p) => p.runId !== runId);
    tests[test.fullName] = [point, ...withoutRun];
  }

  return {
    runs,
    tests: { version: 1, tests },
  };
}

export function pruneHistory(
  history: CanonicalHistory,
  options: RetentionOptions,
): CanonicalHistory {
  const prunedRunEntries = pruneRuns(history.runs.runs, options) as CanonicalRunEntry[];
  const retainedRunIds = new Set(prunedRunEntries.map((r) => r.runId));

  const prunedTests: Record<string, TestHistoryPoint[]> = {};
  for (const [name, points] of Object.entries(history.tests.tests)) {
    const filtered = points.filter((p) => retainedRunIds.has(p.runId));
    if (filtered.length > 0) {
      prunedTests[name] = filtered;
    }
  }

  return {
    runs: {
      ...history.runs,
      updatedAt: new Date().toISOString(),
      runs: prunedRunEntries,
    },
    tests: { version: 1, tests: prunedTests },
  };
}

export function branchRuns(
  history: CanonicalHistory,
  branchKey: string,
): RunManifestEntry[] {
  return history.runs.runs
    .filter((r) => r.branchKey === branchKey)
    .map(({ failedTests: _f, testOutcomes: _t, branchKey: _k, branchLabel: _l, branchType: _b, ...entry }) => entry);
}

function computePassRate(points: TestHistoryPoint[]): { passRate: number; runCount: number } {
  const counted = points.filter((p) => p.o === 0 || p.o === 1);
  const runCount = counted.length;
  if (runCount === 0) return { passRate: 0, runCount: 0 };
  const passed = counted.filter((p) => p.o === 0).length;
  return { passRate: Math.round((passed / runCount) * 1000) / 10, runCount };
}

function dedupePointsByRunId(points: TestHistoryPoint[]): TestHistoryPoint[] {
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

export function composeTrendsFile(
  history: CanonicalHistory,
  run: TestRun,
  branchKey: string,
  branchLabel: string,
): TrendsFile {
  const currentBranchRuns = branchRuns(history, branchKey);
  const summary = buildTrendData(branchKey, currentBranchRuns);

  const relevantBranchKeys = new Set<string>([MAIN_BRANCH_KEY, branchKey]);
  const tests: Record<string, TestHistoryEntry> = {};

  for (const test of run.tests) {
    const allPoints = history.tests.tests[test.fullName] ?? [];
    const filtered = allPoints.filter((p) => relevantBranchKeys.has(p.branchKey));
    const points = dedupePointsByRunId(filtered).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const { passRate, runCount } = computePassRate(points);
    tests[test.fullName] = { passRate, runCount, points };
  }

  return {
    version: 1,
    repository: run.context.repository,
    updatedAt: new Date().toISOString(),
    context: { branchKey, branchLabel },
    runs: currentBranchRuns,
    summary,
    tests,
  };
}

export function readPreviousRunFromCanonical(
  history: CanonicalHistory,
  branchKey: string,
  currentRunId: string,
): PreviousRun | undefined {
  const branchRunList = history.runs.runs
    .filter((r) => r.branchKey === branchKey && r.runId !== currentRunId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const prior = branchRunList[0];
  if (!prior?.commitSha) return undefined;

  const outcomes = new Map<string, import('../model/test-case').TestOutcome>();
  const durations = new Map<string, number>();
  const testNames = new Set<string>();
  for (const t of prior.testOutcomes ?? []) {
    testNames.add(t.n);
    outcomes.set(t.n, (['passed', 'failed', 'skipped', 'inconclusive'] as const)[t.o] ?? 'inconclusive');
    if (typeof t.d === 'number') {
      durations.set(t.n, t.d);
    }
  }

  return {
    commitSha: prior.commitSha,
    commitShortSha: prior.commitShortSha,
    outcomes,
    durations,
    testNames,
  };
}

export function readPreviousFailedFromCanonical(
  history: CanonicalHistory,
  branchKey: string,
  currentRunId: string,
): string[] | undefined {
  const branchRunList = history.runs.runs
    .filter((r) => r.branchKey === branchKey && r.runId !== currentRunId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return branchRunList[0]?.failedTests;
}
