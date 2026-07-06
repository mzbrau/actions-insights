import { describe, expect, it } from 'vitest';
import type { TestCase } from '../../src/model/test-case';
import { mergePartialRun, readPartialRun } from '../../src/history/merge-run';
import type { TestRun } from '../../src/model/test-run';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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

function makeRun(tests: TestCase[], runId = 1): TestRun {
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
      durationMs: tests.reduce((s, t) => s + t.durationMs, 0),
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
      branch: 'main',
      ref: 'refs/heads/main',
      commitSha: 'abc123',
      commitShortSha: 'abc123',
      commitMessage: 'test',
      commitUrl: 'https://github.com/owner/repo/commit/abc123',
      author: 'dev',
      actor: 'dev',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    sourceFiles: [],
    reportPath: '_report',
  };
}

describe('merge-run', () => {
  it('merges tests from prior partial run', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-'));
    const partialPath = path.join(dir, 'partial.json');

    const step1 = makeRun([makeTest('TestA', 'passed')], 99);
    mergePartialRun(step1, partialPath);

    const step2 = makeRun([makeTest('TestB', 'failed')], 99);
    const merged = mergePartialRun(step2, partialPath);

    expect(merged.tests).toHaveLength(2);
    expect(merged.stats.failed).toBe(1);
    expect(merged.stats.passed).toBe(1);

    const stored = readPartialRun(partialPath);
    expect(stored).toHaveLength(2);

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('uses worse outcome when duplicate test names merge', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-'));
    const partialPath = path.join(dir, 'partial.json');

    mergePartialRun(makeRun([makeTest('TestA', 'passed')], 99), partialPath);
    const merged = mergePartialRun(makeRun([makeTest('TestA', 'failed')], 99), partialPath);

    expect(merged.tests[0].outcome).toBe('failed');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
