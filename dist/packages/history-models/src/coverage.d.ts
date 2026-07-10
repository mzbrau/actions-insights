import { HISTORY_SCHEMA_VERSION } from './index';
export interface CoverageMetrics {
    line?: number;
    branch?: number;
    method?: number;
    class?: number;
    file?: number;
    coveredLines?: number;
    totalLines?: number;
    coveredBranches?: number;
    totalBranches?: number;
    coveredMethods?: number;
    totalMethods?: number;
    coveredClasses?: number;
    totalClasses?: number;
    coveredFiles?: number;
    totalFiles?: number;
}
export interface CoverageSummary extends CoverageMetrics {
}
export interface CoverageFile {
    path: string;
    metrics: CoverageMetrics;
}
export interface CoverageClass {
    name: string;
    file?: string;
    metrics: CoverageMetrics;
}
export interface CoveragePackage {
    name: string;
    metrics: CoverageMetrics;
    classes?: CoverageClass[];
}
export interface CoverageProject {
    name: string;
    metrics: CoverageMetrics;
    packages?: CoveragePackage[];
    files?: CoverageFile[];
}
export interface CoverageParseError {
    file: string;
    message: string;
}
export interface CoverageReport {
    summary: CoverageSummary;
    projects: CoverageProject[];
    sourceFiles: string[];
    matchedFiles?: string[];
    errors?: CoverageParseError[];
}
export interface CoverageSummaryCompact extends CoverageMetrics {
    projects?: Record<string, CoverageMetrics>;
}
export interface CompactCoverageProject {
    name: string;
    metrics: CoverageMetrics;
    packages?: Array<{
        name: string;
        metrics: CoverageMetrics;
        classes?: Array<{
            name: string;
            file?: string;
            metrics: CoverageMetrics;
        }>;
    }>;
}
export interface CompactCoverageFile {
    p: number;
    metrics: CoverageMetrics;
}
export interface CoverageRunRecord {
    version: typeof HISTORY_SCHEMA_VERSION;
    runId: string;
    summary: CoverageSummaryCompact;
    projects: CompactCoverageProject[];
    paths?: string[];
    files?: CompactCoverageFile[];
}
export declare function percentFromCounts(covered: number, total: number): number | undefined;
export declare function mergeMetrics(a: CoverageMetrics, b: CoverageMetrics): CoverageMetrics;
export declare function aggregateMetricsFromProjects(projects: CoverageProject[]): CoverageSummary;
export declare function toCoverageSummaryCompact(report: CoverageReport): CoverageSummaryCompact;
export declare function encodeCoverageRunRecord(runId: string, report: CoverageReport): CoverageRunRecord;
export declare function decodeCoverageRunRecord(record: CoverageRunRecord): CoverageReport;
export declare function normalizeCoverageRunRecord(raw: unknown): CoverageRunRecord;
//# sourceMappingURL=coverage.d.ts.map