import type { RunContext } from '../model/test-run';
export interface ReportPaths {
    branchKey: string;
    branchLabel: string;
    branchType: 'branch' | 'pr' | 'tag';
    runDirName: string;
    branchDir: string;
    runDir: string;
    latestDir: string;
    relativeReportUrl: string;
    relativeBranchUrl: string;
    relativeLatestUrl: string;
}
export declare function resolveReportPaths(context: RunContext, pagesSubdirectory: string): ReportPaths;
export declare function resolveBranchKey(context: RunContext): {
    branchKey: string;
    branchLabel: string;
    branchType: 'branch' | 'pr' | 'tag';
};
export declare function buildReportUrl(pagesBaseUrl: string | undefined, relativePath: string): string | undefined;
export declare function cacheKey(owner: string, repo: string): string;
//# sourceMappingURL=paths.d.ts.map