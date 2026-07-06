import type { ActionConfig } from '../config';
import type { TestCase } from '../model/test-case';
import type { TestRun } from '../model/test-run';
import { computeExtendedStats } from './stats';
import { countFailedTests } from './failures';
import { selectSlowestTests } from './slow-tests';

export interface ReportingContext {
  run: TestRun;
  failedTests: TestCase[];
  failedCount: number;
  slowTests: TestCase[];
  skippedTests: TestCase[];
  extendedStats: ReturnType<typeof computeExtendedStats>;
}

export function buildReportingContext(run: TestRun, config: ActionConfig): ReportingContext {
  const failedCount = countFailedTests(run.tests);
  const failedTests: TestCase[] = [];
  for (const test of run.tests) {
    if (test.outcome === 'failed') failedTests.push(test);
  }
  failedTests.sort((a, b) => a.fullName.localeCompare(b.fullName));

  const skippedTests: TestCase[] = [];
  for (const test of run.tests) {
    if (test.outcome === 'skipped') skippedTests.push(test);
  }
  skippedTests.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return {
    run,
    failedTests,
    failedCount,
    slowTests: selectSlowestTests(run.tests, config.includeSlowestTests),
    skippedTests,
    extendedStats: computeExtendedStats(run.stats, run.tests),
  };
}
