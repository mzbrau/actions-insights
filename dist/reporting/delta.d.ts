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
export interface DeltaSectionConfig {
    heading: string;
    newFailuresHint: string;
    fixedFailuresHint: string;
    performanceRegressionsHint: string;
}
export declare const BASE_BRANCH_DELTA_CONFIG: Omit<DeltaSectionConfig, 'heading'>;
export declare const PUSH_DELTA_CONFIG: Omit<DeltaSectionConfig, 'heading'>;
export declare function buildBaseBranchDeltaHeading(branchLabel: string, commitSha: string, repositoryUrl: string): string;
export declare function buildPushDeltaHeading(shortSha: string, commitSha: string, repositoryUrl: string): string;
export declare function formatDeltaSection(delta: TestDelta, previousRun: PreviousRun | undefined, section: DeltaSectionConfig): string | undefined;
//# sourceMappingURL=delta.d.ts.map