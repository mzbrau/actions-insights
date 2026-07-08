import { describe, expect, it } from 'vitest';
import { computeRunMetrics } from './repositoryRuns';
import type { EnrichedRun } from './repositoryRuns';

function makeRun(overrides: Partial<EnrichedRun> = {}): EnrichedRun {
  return {
    runId: '1',
    workflowRunId: 1,
    status: 'passed',
    date: '2026-07-07T10:00:00.000Z',
    durationMs: 1000,
    total: 5,
    passed: 5,
    failed: 0,
    skipped: 0,
    commitSha: 'abc',
    commitShortSha: 'abc',
    commitMessage: 'test',
    author: 'dev',
    runFile: 'run.json',
    branchKey: 'main',
    branchLabel: 'main',
    branchType: 'branch',
    ...overrides,
  };
}

describe('computeRunMetrics', () => {
  it('returns zeros for empty runs', () => {
    expect(computeRunMetrics([])).toEqual({
      total: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
      failRate: 0,
      avgDurationMs: 0,
    });
  });

  it('computes pass and fail rates', () => {
    const runs = [
      makeRun({ status: 'passed', durationMs: 1000 }),
      makeRun({ runId: '2', status: 'passed', durationMs: 3000 }),
      makeRun({ runId: '3', status: 'failed', durationMs: 2000 }),
    ];
    const metrics = computeRunMetrics(runs);
    expect(metrics.total).toBe(3);
    expect(metrics.passed).toBe(2);
    expect(metrics.failed).toBe(1);
    expect(metrics.passRate).toBe(66.7);
    expect(metrics.failRate).toBe(33.3);
    expect(metrics.avgDurationMs).toBe(2000);
  });
});
