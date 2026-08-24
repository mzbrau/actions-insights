import { describe, expect, it } from 'vitest';
import { buildCheckTitle, formatStatusReasonLine } from '../../src/reporting/status-reason';
import type { TestRun } from '../../src/model/test-run';
import { sampleRun } from '../reporting/fixtures';

describe('formatStatusReasonLine', () => {
  it('returns reason when failed with no tests', () => {
    const run: TestRun = {
      ...sampleRun,
      status: 'failed',
      statusReason: 'Prior job step failed (Build); no test results found',
      stats: { ...sampleRun.stats, total: 0, passed: 0, failed: 0 },
      tests: [],
    };
    expect(formatStatusReasonLine(run)).toBe(run.statusReason);
  });

  it('returns undefined when tests exist', () => {
    expect(formatStatusReasonLine(sampleRun)).toBeUndefined();
  });
});

describe('buildCheckTitle', () => {
  it('uses status reason when failed without test failures', () => {
    const run: TestRun = {
      ...sampleRun,
      status: 'failed',
      statusReason: 'Prior job step failed (Build); no test results found',
      stats: { ...sampleRun.stats, total: 0, passed: 0, failed: 0 },
      tests: [],
    };
    expect(buildCheckTitle(run)).toBe(run.statusReason);
  });

  it('uses pass/fail counts when tests failed', () => {
    expect(buildCheckTitle(sampleRun)).toBe('1 passed, 1 failed');
  });
});
