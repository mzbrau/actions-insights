import type { ActionConfig } from '../config';
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
}
export declare function buildReportingContext(run: TestRun, config: ActionConfig): ReportingContext;
//# sourceMappingURL=context.d.ts.map