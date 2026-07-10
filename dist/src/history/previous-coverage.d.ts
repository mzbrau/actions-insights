import type { CoverageSummaryCompact } from '../model/coverage';
import type { CanonicalHistory } from '../model/manifest';
export interface PreviousCoverageRun {
    commitSha: string;
    commitShortSha: string;
    summary: CoverageSummaryCompact;
}
export declare function readPreviousCoverageFromCanonical(history: CanonicalHistory, branchKey: string, currentRunId: string): PreviousCoverageRun | undefined;
export declare function readBaseBranchCoverageFromCanonical(history: CanonicalHistory, baseBranchKey: string): PreviousCoverageRun | undefined;
export declare function readCoverageForPreviousRun(history: CanonicalHistory, branchKey: string, currentRunId: string): PreviousCoverageRun | undefined;
//# sourceMappingURL=previous-coverage.d.ts.map