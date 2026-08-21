import { describe, expect, it } from 'vitest';
import type { TestCase } from '../../src/model/test-case';
import {
  computeSuiteSummaries,
  shouldShowSuiteSummary,
  suiteNameForTest,
} from '../../src/reporting/suite-summary';

function makeTest(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: '1',
    name: 'ShouldPass',
    fullName: 'SampleTests.ShouldPass',
    outcome: 'passed',
    durationMs: 10,
    attachments: [],
    traits: [],
    categories: [],
    retries: 0,
    sourceFile: 'sample.trx',
    ...overrides,
  };
}

describe('suite-summary', () => {
  it('falls back to No suite when assembly is missing', () => {
    expect(suiteNameForTest(makeTest())).toBe('No suite');
    expect(suiteNameForTest(makeTest({ assembly: '  ' }))).toBe('No suite');
    expect(suiteNameForTest(makeTest({ assembly: 'Unit.dll' }))).toBe('Unit.dll');
  });

  it('hides summary when the only bucket is No suite', () => {
    const summaries = computeSuiteSummaries([
      makeTest({ id: '1' }),
      makeTest({ id: '2', name: 'Other', fullName: 'SampleTests.Other' }),
    ]);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].suite).toBe('No suite');
    expect(shouldShowSuiteSummary(summaries)).toBe(false);
  });

  it('shows summary when named suites are present', () => {
    const summaries = computeSuiteSummaries([
      makeTest({ assembly: 'Alpha.dll' }),
      makeTest({ id: '2', assembly: 'Beta.dll', outcome: 'failed' }),
    ]);
    expect(shouldShowSuiteSummary(summaries)).toBe(true);
  });
});
