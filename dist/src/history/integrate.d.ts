import type { ActionConfig } from '../config';
import type { TestRun } from '../model/test-run';
import type { PreviousRun } from '../history/previous-run';
import type { PreviousCoverageRun } from '../history/previous-coverage';
export declare function applyNewFailureFlags(run: TestRun, previousFailed: string[] | undefined): void;
export declare function integrateReportIntoSite(run: TestRun, config: ActionConfig, siteDir: string): {
    relativeReportPath: string;
    previousRun?: PreviousRun;
    baseBranchRun?: PreviousRun;
    previousCoverageRun?: PreviousCoverageRun;
    baseBranchCoverageRun?: PreviousCoverageRun;
    artifactDir: string;
    mergedRun: TestRun;
};
//# sourceMappingURL=integrate.d.ts.map