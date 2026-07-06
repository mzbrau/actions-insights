import { describe, expect, it } from 'vitest';
import type { TestCase } from '../../src/model/test-case';
import {
  appendRunToHistory,
  composeTrendsFile,
  MAIN_BRANCH_KEY,
  pruneHistory,
  readCanonicalHistory,
} from '../../src/history/trends-store';
import type { TestRun } from '../../src/model/test-run';

function makeTest(name: string, outcome: TestCase['outcome']): TestCase {
  return {
    id: name,
    name,
    fullName: `SampleTests.${name}`,
    outcome,
    durationMs: 100,
    assembly: 'SampleTests.dll',
    namespace: 'SampleTests',
    className: 'SampleTests',
    method: name,
    attachments: [],
    traits: [],
    categories: [],
    retries: 0,
    sourceFile: 'sample.trx',
  };
}

function makeRun(
  tests: TestCase[],
  opts: { runId?: number; branch?: string; prNumber?: number } = {},
): TestRun {
  const runId = opts.runId ?? 1;
  const branch = opts.branch ?? 'main';
  return {
    id: String(runId),
    title: 'Test',
    status: tests.some((t) => t.outcome === 'failed') ? 'failed' : 'passed',
    stats: {
      total: tests.length,
      passed: tests.filter((t) => t.outcome === 'passed').length,
      failed: tests.filter((t) => t.outcome === 'failed').length,
      skipped: 0,
      inconclusive: 0,
      durationMs: 100,
      successRate: 100,
    },
    tests,
    context: {
      repository: 'owner/repo',
      repositoryUrl: 'https://github.com/owner/repo',
      workflow: 'CI',
      workflowUrl: 'https://github.com/owner/repo/actions/runs/1',
      runId,
      runAttempt: 1,
      branch,
      ref: opts.prNumber ? 'refs/pull/1/merge' : `refs/heads/${branch}`,
      prNumber: opts.prNumber,
      commitSha: `sha${runId}`,
      commitShortSha: `sha${runId}`,
      commitMessage: 'test',
      commitUrl: 'https://github.com/owner/repo/commit/sha',
      author: 'dev',
      actor: 'dev',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    sourceFiles: [],
    reportPath: '_report',
  };
}

describe('trends-store', () => {
  it('appends run history idempotently by runId', () => {
    let history = readCanonicalHistory('/nonexistent', 'test-reports');
    const run = makeRun([makeTest('TestA', 'passed')], { runId: 1 });

    history = appendRunToHistory(history, run, MAIN_BRANCH_KEY, 'main', 'branch');
    history = appendRunToHistory(history, run, MAIN_BRANCH_KEY, 'main', 'branch');

    expect(history.runs.runs).toHaveLength(1);
    expect(history.tests.tests['SampleTests.TestA']).toHaveLength(1);
  });

  it('composes cross-branch test history including main', () => {
    let history = readCanonicalHistory('/nonexistent', 'test-reports');

    const mainRun = makeRun([makeTest('TestA', 'passed')], { runId: 1, branch: 'main' });
    history = appendRunToHistory(history, mainRun, MAIN_BRANCH_KEY, 'main', 'branch');

    const mainRun2 = makeRun([makeTest('TestA', 'failed')], { runId: 2, branch: 'main' });
    history = appendRunToHistory(history, mainRun2, MAIN_BRANCH_KEY, 'main', 'branch');

    const prRun = makeRun([makeTest('TestA', 'passed')], { runId: 3, branch: 'feature', prNumber: 42 });
    history = appendRunToHistory(history, prRun, 'pr-42', 'PR #42', 'pr');

    const trends = composeTrendsFile(history, prRun, 'pr-42', 'PR #42');
    const entry = trends.tests['SampleTests.TestA'];

    expect(entry.runCount).toBe(3);
    expect(entry.passRate).toBeCloseTo(66.7, 0);
    expect(entry.points.some((p) => p.branchKey === MAIN_BRANCH_KEY)).toBe(true);
    expect(entry.points.some((p) => p.branchKey === 'pr-42')).toBe(true);
  });

  it('prunes old runs and orphaned test points', () => {
    let history = readCanonicalHistory('/nonexistent', 'test-reports');
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

    history.runs.runs.push({
      runId: 'old',
      workflowRunId: 0,
      status: 'passed',
      date: oldDate,
      durationMs: 100,
      total: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      commitSha: 'old',
      commitShortSha: 'old',
      commitMessage: 'old',
      author: 'dev',
      path: 'report.html',
      branchKey: MAIN_BRANCH_KEY,
      branchLabel: 'main',
      branchType: 'branch',
      failedTests: [],
      testOutcomes: [{ n: 'SampleTests.OldTest', o: 0 }],
    });
    history.tests.tests['SampleTests.OldTest'] = [{
      runId: 'old',
      date: oldDate,
      o: 0,
      d: 100,
      commitShortSha: 'old',
      branchKey: MAIN_BRANCH_KEY,
      branchLabel: 'main',
    }];

    const pruned = pruneHistory(history, { historyLimit: 20, retainDays: 30 });
    expect(pruned.runs.runs.find((r) => r.runId === 'old')).toBeUndefined();
    expect(pruned.tests.tests['SampleTests.OldTest']).toBeUndefined();
  });
});
