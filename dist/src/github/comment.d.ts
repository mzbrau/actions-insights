import type { ActionConfig } from '../config';
import type { PreviousCoverageRun } from '../history/previous-coverage';
import type { PreviousRun } from '../history/previous-run';
import type { TestRun } from '../model/test-run';
export declare function upsertPrComment(token: string, run: TestRun, config: ActionConfig, previousRun?: PreviousRun, baseBranchRun?: PreviousRun, historyRunUrl?: string, previousCoverageRun?: PreviousCoverageRun, baseBranchCoverageRun?: PreviousCoverageRun): Promise<void>;
//# sourceMappingURL=comment.d.ts.map