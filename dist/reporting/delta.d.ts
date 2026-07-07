import type { TestCase } from '../model/test-case';
import type { PreviousRun } from '../history/previous-run';
export interface PerformanceRegression {
    test: TestCase;
    previousDurationMs: number;
    currentDurationMs: number;
}
export interface TestDelta {
    previousCommit?: {
        sha: string;
        shortSha: string;
    };
    newFailures: TestCase[];
    fixedTests: TestCase[];
    performanceRegressions: PerformanceRegression[];
    newTests: TestCase[];
    removedTests: string[];
}
export interface TestDeltaOptions {
    slowdownRatio?: number;
    slowdownMinMs?: number;
}
export declare function computeTestDelta(current: TestCase[], previousRun: PreviousRun | undefined, currentCommitSha: string, options?: TestDeltaOptions): TestDelta;
export declare function formatDeltaSection(delta: TestDelta, previousRun: PreviousRun | undefined, repositoryUrl: string): string | undefined;
//# sourceMappingURL=delta.d.ts.map