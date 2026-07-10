import type { CoverageMetrics, CoverageReport } from '../model/coverage';
export declare function mergeCoverageReports(reports: CoverageReport[]): CoverageReport;
export declare function emptyCoverageReport(sourceFile: string): CoverageReport;
export declare function metricsPercentConflict(a: CoverageMetrics, b: CoverageMetrics, tolerance?: number): boolean;
//# sourceMappingURL=merge.d.ts.map