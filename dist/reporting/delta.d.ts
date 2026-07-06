import type { TestCase } from '../model/test-case';
import type { PreviousRun } from '../history/previous-run';
export interface TestDelta {
    previousCommit?: {
        sha: string;
        shortSha: string;
    };
    newFailures: TestCase[];
    fixedTests: TestCase[];
}
export declare function computeTestDelta(current: TestCase[], previousRun: PreviousRun | undefined, currentCommitSha: string): TestDelta;
export declare function formatDeltaSection(delta: TestDelta, previousRun: PreviousRun | undefined, repositoryUrl: string): string | undefined;
//# sourceMappingURL=delta.d.ts.map