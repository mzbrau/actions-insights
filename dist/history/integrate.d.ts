import type { ActionConfig } from '../config';
import type { BranchManifest, RunManifestEntry, SiteManifest } from '../model/manifest';
import type { TestRun } from '../model/test-run';
export declare function applyNewFailureFlags(run: TestRun, previousFailed: string[] | undefined): void;
export declare function updateBranchManifest(existing: BranchManifest | undefined, entry: RunManifestEntry, branchKey: string, branchLabel: string, branchType: BranchManifest['type'], latestPath: string, options: {
    historyLimit: number;
    retainDays: number;
}): BranchManifest;
export declare function integrateReportIntoSite(run: TestRun, config: ActionConfig, siteDir: string, pagesBaseUrl?: string): {
    reportUrl?: string;
    siteManifest: SiteManifest;
};
//# sourceMappingURL=integrate.d.ts.map