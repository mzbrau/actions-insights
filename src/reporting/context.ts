import type { ActionConfig } from '../config';
import type { PreviousCoverageRun } from '../history/previous-coverage';
import type { PreviousRun } from '../history/previous-run';
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
  previousRun?: PreviousRun;
  baseBranchRun?: PreviousRun;
  previousCoverageRun?: PreviousCoverageRun;
  baseBranchCoverageRun?: PreviousCoverageRun;
}

export function buildReportingContext(
  run: TestRun,
  config: ActionConfig,
  previousRun?: PreviousRun,
  baseBranchRun?: PreviousRun,
  previousCoverageRun?: PreviousCoverageRun,
  baseBranchCoverageRun?: PreviousCoverageRun,
): ReportingContext {
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
    previousRun,
    baseBranchRun,
    previousCoverageRun,
    baseBranchCoverageRun,
  };
}
