import type { CoverageMetrics } from '../model/coverage';
import type { PreviousCoverageRun } from '../history/previous-coverage';
export interface CoverageDeltaContext {
    current?: CoverageMetrics;
    previous?: PreviousCoverageRun;
    baseBranch?: PreviousCoverageRun;
    isPullRequest: boolean;
    baseBranchLabel?: string;
}
export declare function resolveCoverageComparison(ctx: CoverageDeltaContext): {
    delta: {
        line?: number;
        branch?: number;
    };
    vsLabel: string;
} | undefined;
//# sourceMappingURL=coverage-delta.d.ts.map