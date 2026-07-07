import { describe, expect, it } from 'vitest';
import { computeTestDelta, formatDeltaSection } from '../../src/reporting/delta';
import type { TestCase } from '../../src/model/test-case';
import type { PreviousRun } from '../../src/history/previous-run';

function makeTest(
  fullName: string,
  outcome: TestCase['outcome'],
  durationMs = 10,
): TestCase {
  return {
    id: fullName,
    name: fullName.split('.').pop() ?? fullName,
    fullName,
    outcome,
    durationMs,
    attachments: [],
    traits: [],
    categories: [],
    retries: 0,
    sourceFile: 'test.trx',
  };
}

function makePreviousRun(
  outcomes: Array<[string, TestCase['outcome']]>,
  durations: Array<[string, number]> = [],
): PreviousRun {
  const outcomeMap = new Map(outcomes);
  const durationMap = new Map(durations);
  return {
    commitSha: 'abc123def456',
    commitShortSha: 'abc123d',
    outcomes: outcomeMap,
    durations: durationMap,
    testNames: new Set(outcomes.map(([name]) => name)),
  };
}

describe('delta', () => {
  const previousRun = makePreviousRun(
    [
      ['SampleTests.WasPassing', 'passed'],
      ['SampleTests.WasFailing', 'failed'],
      ['SampleTests.StillFailing', 'failed'],
      ['SampleTests.SlowTest', 'passed'],
      ['SampleTests.RemovedTest', 'passed'],
    ],
    [
      ['SampleTests.SlowTest', 100],
      ['SampleTests.WasPassing', 10],
      ['SampleTests.WasFailing', 10],
      ['SampleTests.StillFailing', 10],
      ['SampleTests.RemovedTest', 10],
    ],
  );

  it('detects new failures and fixed tests', () => {
    const current = [
      makeTest('SampleTests.WasPassing', 'failed'),
      makeTest('SampleTests.WasFailing', 'passed'),
      makeTest('SampleTests.StillFailing', 'failed'),
      makeTest('SampleTests.SlowTest', 'passed', 100),
      makeTest('SampleTests.RemovedTest', 'passed'),
    ];
    const delta = computeTestDelta(current, previousRun, 'newsha123');
    expect(delta.newFailures).toHaveLength(1);
    expect(delta.newFailures[0].fullName).toBe('SampleTests.WasPassing');
    expect(delta.fixedTests).toHaveLength(1);
    expect(delta.fixedTests[0].fullName).toBe('SampleTests.WasFailing');
  });

  it('detects performance regressions, new tests, and removed tests', () => {
    const current = [
      makeTest('SampleTests.WasPassing', 'passed'),
      makeTest('SampleTests.WasFailing', 'failed'),
      makeTest('SampleTests.StillFailing', 'failed'),
      makeTest('SampleTests.SlowTest', 'passed', 500),
      makeTest('SampleTests.BrandNew', 'passed'),
    ];
    const delta = computeTestDelta(current, previousRun, 'newsha123', {
      slowdownRatio: 1.5,
      slowdownMinMs: 100,
    });

    expect(delta.performanceRegressions).toHaveLength(1);
    expect(delta.performanceRegressions[0].test.fullName).toBe('SampleTests.SlowTest');
    expect(delta.newTests).toHaveLength(1);
    expect(delta.newTests[0].fullName).toBe('SampleTests.BrandNew');
    expect(delta.removedTests).toEqual(['SampleTests.RemovedTest']);
  });

  it('returns empty delta for same commit', () => {
    const current = [makeTest('SampleTests.WasPassing', 'failed')];
    const delta = computeTestDelta(current, previousRun, previousRun.commitSha);
    expect(delta.newFailures).toHaveLength(0);
    expect(delta.fixedTests).toHaveLength(0);
    expect(delta.performanceRegressions).toHaveLength(0);
    expect(delta.newTests).toHaveLength(0);
    expect(delta.removedTests).toHaveLength(0);
  });

  it('formats delta section with commit link and change categories', () => {
    const current = [
      makeTest('SampleTests.WasPassing', 'failed'),
      makeTest('SampleTests.WasFailing', 'passed'),
      makeTest('SampleTests.SlowTest', 'passed', 500),
      makeTest('SampleTests.BrandNew', 'passed'),
    ];
    const delta = computeTestDelta(current, previousRun, 'newsha123', {
      slowdownRatio: 1.5,
      slowdownMinMs: 100,
    });
    const section = formatDeltaSection(delta, previousRun, 'https://github.com/owner/repo');
    expect(section).toContain('## Changes since [abc123d]');
    expect(section).toContain('**🆕 New failures (1)**');
    expect(section).toContain('**✅ Fixed failures (1)**');
    expect(section).toContain('**⏱️ Performance regressions (1)**');
    expect(section).toContain('**➕ New tests (1)**');
    expect(section).toContain('**➖ Removed tests (2)**');
    expect(section).toContain('was passing');
    expect(section).toContain('was failing');
    expect(section).toContain('× slower');
  });
});
