import { describe, expect, it } from 'vitest';
import { computeTestDelta, formatDeltaSection } from '../../src/reporting/delta';
import type { TestCase } from '../../src/model/test-case';
import type { PreviousRun } from '../../src/history/previous-run';

function makeTest(fullName: string, outcome: TestCase['outcome']): TestCase {
  return {
    id: fullName,
    name: fullName.split('.').pop() ?? fullName,
    fullName,
    outcome,
    durationMs: 10,
    attachments: [],
    traits: [],
    categories: [],
    retries: 0,
    sourceFile: 'test.trx',
  };
}

describe('delta', () => {
  const previousRun: PreviousRun = {
    commitSha: 'abc123def456',
    commitShortSha: 'abc123d',
    outcomes: new Map([
      ['SampleTests.WasPassing', 'passed'],
      ['SampleTests.WasFailing', 'failed'],
      ['SampleTests.StillFailing', 'failed'],
    ]),
  };

  it('detects new failures and fixed tests', () => {
    const current = [
      makeTest('SampleTests.WasPassing', 'failed'),
      makeTest('SampleTests.WasFailing', 'passed'),
      makeTest('SampleTests.StillFailing', 'failed'),
    ];
    const delta = computeTestDelta(current, previousRun, 'newsha123');
    expect(delta.newFailures).toHaveLength(1);
    expect(delta.newFailures[0].fullName).toBe('SampleTests.WasPassing');
    expect(delta.fixedTests).toHaveLength(1);
    expect(delta.fixedTests[0].fullName).toBe('SampleTests.WasFailing');
  });

  it('returns empty delta for same commit', () => {
    const current = [makeTest('SampleTests.WasPassing', 'failed')];
    const delta = computeTestDelta(current, previousRun, previousRun.commitSha);
    expect(delta.newFailures).toHaveLength(0);
    expect(delta.fixedTests).toHaveLength(0);
  });

  it('formats delta section with commit link', () => {
    const current = [
      makeTest('SampleTests.WasPassing', 'failed'),
      makeTest('SampleTests.WasFailing', 'passed'),
    ];
    const delta = computeTestDelta(current, previousRun, 'newsha123');
    const section = formatDeltaSection(delta, previousRun, 'https://github.com/owner/repo');
    expect(section).toContain('### Changes since [abc123d]');
    expect(section).toContain('**New failures (1)**');
    expect(section).toContain('**Fixed (1)**');
    expect(section).toContain('was passing');
    expect(section).toContain('was failing');
  });
});
