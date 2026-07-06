import { describe, expect, it } from 'vitest';
import { pruneRuns } from '../../src/history/retention';
import { buildTrendData, detectNewFailures } from '../../src/history/trends';
import type { RunManifestEntry } from '../../src/model/manifest';

function entry(id: string, daysAgo: number): RunManifestEntry {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    runId: id,
    workflowRunId: Number(id),
    status: 'passed',
    date,
    durationMs: 1000,
    total: 10,
    passed: 10,
    failed: 0,
    skipped: 0,
    commitSha: 'abc',
    commitShortSha: 'abc',
    commitMessage: 'test',
    author: 'dev',
    path: `main/run-${id}/`,
  };
}

describe('retention', () => {
  it('limits by count and age', () => {
    const runs = [entry('1', 1), entry('2', 2), entry('3', 40), entry('4', 5)];
    const pruned = pruneRuns(runs, { historyLimit: 2, retainDays: 30 });
    expect(pruned).toHaveLength(2);
    expect(pruned.map((r) => r.runId)).toEqual(['1', '2']);
  });
});

describe('trends', () => {
  it('detects new failures', () => {
    const result = detectNewFailures(['a', 'b'], ['a']);
    expect([...result]).toEqual(['b']);
  });

  it('builds trend data', () => {
    const runs = [entry('1', 1), entry('2', 2)];
    const trend = buildTrendData('main', runs);
    expect(trend.totalRuns).toBe(2);
    expect(trend.points).toHaveLength(2);
  });
});
