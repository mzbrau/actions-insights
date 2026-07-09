import type { TestOutcome } from '../model/test-case';
import { CODE_TO_OUTCOME } from '../model/manifest';
import type { CanonicalHistory } from '../model/manifest';
export interface PreviousRun {
    commitSha: string;
    commitShortSha: string;
    outcomes: Map<string, TestOutcome>;
    durations: Map<string, number>;
    testNames: Set<string>;
}
export declare function readPreviousRunFromHistory(history: CanonicalHistory, branchKey: string, currentRunId: string): PreviousRun | undefined;
export { CODE_TO_OUTCOME };
//# sourceMappingURL=previous-run.d.ts.map