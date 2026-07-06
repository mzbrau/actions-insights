import type { ThemeMode } from '../../config';
import type { BranchManifest, TrendData } from '../../model/manifest';
import type { TestRun } from '../../model/test-run';
export declare function renderBranchHistoryPage(run: TestRun, reportTitle: string, theme: ThemeMode, manifest: BranchManifest, trend: TrendData, pagesBaseUrl?: string): string;
export declare function renderSiteIndex(reportTitle: string, repository: string, branches: BranchManifest[], pagesBaseUrl?: string): string;
//# sourceMappingURL=history.d.ts.map