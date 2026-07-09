import type { ActionConfig } from '../config';
import type { PreviousRun } from '../history/previous-run';
import type { TestCase } from '../model/test-case';
import type { TestRun } from '../model/test-run';
import { computeExtendedStats } from './stats';
export interface ReportingContext {
    run: TestRun;
    failedTests: TestCase[];
    failedCount: number;
    slowTests: TestCase[];
    skippedTests: TestCase[];
    extendedStats: ReturnType<typeof computeExtendedStats>;
    previousRun?: PreviousRun;
    baseBranchRun?: PreviousRun;
}
export declare function buildReportingContext(run: TestRun, config: ActionConfig, previousRun?: PreviousRun, baseBranchRun?: PreviousRun): ReportingContext;
//# sourceMappingURL=context.d.ts.map