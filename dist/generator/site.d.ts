import type { ActionConfig } from '../config';
import type { BranchManifest, RunManifestEntry, SiteManifest } from '../model/manifest';
import type { TestRun } from '../model/test-run';
export interface GeneratedRunReport {
    outputDir: string;
    manifest: RunManifestEntry;
    failedTestNames: string[];
}
export declare function writeRunReport(run: TestRun, outputDir: string, config: ActionConfig, runPath: string): GeneratedRunReport;
export declare function writeBranchHistoryPage(siteDir: string, branchDir: string, run: TestRun, config: ActionConfig, branchManifest: BranchManifest, trend: import('../model/manifest').TrendData): void;
export declare function writeSiteIndex(siteDir: string, reportsSubdirectory: string, manifest: SiteManifest, config: ActionConfig): void;
//# sourceMappingURL=site.d.ts.map