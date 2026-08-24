import { describe, expect, it } from 'vitest';
import { computeStats, deriveRunStatus } from '../../src/model/test-run';
import type { TestCase } from '../../src/model/test-case';
import type { DiagnosticReport } from '../../src/model/diagnostics';

function makeTest(outcome: TestCase['outcome']): TestCase {
  return {
    id: outcome,
    name: outcome,
    fullName: `SampleTests.${outcome}`,
    outcome,
    durationMs: 100,
    attachments: [],
    traits: [],
    categories: [],
  };
}

describe('computeStats', () => {
  it('excludes skipped tests from success rate', () => {
    const stats = computeStats([
      makeTest('passed'),
      makeTest('passed'),
      makeTest('skipped'),
      makeTest('skipped'),
    ]);
    expect(stats.successRate).toBe(100);
  });

  it('computes success rate from passed and failed only', () => {
    const stats = computeStats([
      makeTest('passed'),
      makeTest('failed'),
      makeTest('skipped'),
    ]);
    expect(stats.successRate).toBe(50);
  });

  it('returns 0% when all tests are skipped', () => {
    const stats = computeStats([makeTest('skipped'), makeTest('skipped')]);
    expect(stats.successRate).toBe(0);
  });
});

const baseStatusInput = {
  tests: [] as TestCase[],
  testResultsFailIfMissing: false,
  inferFailureFromJobSteps: true,
  failedPriorSteps: [] as { stepName: string }[],
  diagnosticsEnabled: false,
  diagnosticsFailOnErrors: true,
};

describe('deriveRunStatus', () => {
  it('fails when tests failed', () => {
    const result = deriveRunStatus({
      ...baseStatusInput,
      tests: [makeTest('failed'), makeTest('passed')],
    });
    expect(result).toEqual({ status: 'failed', reason: '1 test(s) failed' });
  });

  it('passes when tests passed', () => {
    const result = deriveRunStatus({
      ...baseStatusInput,
      tests: [makeTest('passed')],
    });
    expect(result).toEqual({ status: 'passed' });
  });

  it('fails when test-results-fail-if-missing is enabled', () => {
    const result = deriveRunStatus({
      ...baseStatusInput,
      testResultsFailIfMissing: true,
    });
    expect(result.status).toBe('failed');
    expect(result.reason).toContain('No test results found');
  });

  it('fails when prior job steps failed and no tests were parsed', () => {
    const result = deriveRunStatus({
      ...baseStatusInput,
      failedPriorSteps: [{ stepName: 'Build' }],
    });
    expect(result).toEqual({
      status: 'failed',
      reason: 'Prior job step failed (Build); no test results found',
    });
  });

  it('fails when diagnostics contain errors and no tests were parsed', () => {
    const diagnostics: DiagnosticReport = {
      summary: { errors: 2, warnings: 1 },
      items: [],
      sourceFiles: ['build.log'],
    };
    const result = deriveRunStatus({
      ...baseStatusInput,
      diagnosticsEnabled: true,
      diagnostics,
    });
    expect(result).toEqual({
      status: 'failed',
      reason: '2 build errors found in diagnostics; no test results found',
    });
  });

  it('passes when no tests and no failure signals', () => {
    const result = deriveRunStatus({ ...baseStatusInput });
    expect(result).toEqual({ status: 'passed' });
  });

  it('does not fail on diagnostics when tests are present', () => {
    const diagnostics: DiagnosticReport = {
      summary: { errors: 3, warnings: 0 },
      items: [],
      sourceFiles: ['build.log'],
    };
    const result = deriveRunStatus({
      ...baseStatusInput,
      tests: [makeTest('passed')],
      diagnosticsEnabled: true,
      diagnostics,
    });
    expect(result).toEqual({ status: 'passed' });
  });
});
