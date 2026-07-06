import type { TestOutcome } from '../model/test-case';
export interface PreviousRun {
    commitSha: string;
    commitShortSha: string;
    outcomes: Map<string, TestOutcome>;
}
export declare function readPreviousRun(siteLatestDir: string): PreviousRun | undefined;
//# sourceMappingURL=previous-run.d.ts.map