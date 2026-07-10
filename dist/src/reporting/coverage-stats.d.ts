import type { CoverageMetrics } from '../model/coverage';
export declare function formatCoveragePercent(value: number | undefined): string;
export declare function computeCoverageDelta(current: CoverageMetrics | undefined, previous: CoverageMetrics | undefined): {
    line?: number;
    branch?: number;
};
export declare function formatCoverageDeltaValue(delta: number | undefined): string;
export declare function formatCoverageCompactLine(summary: CoverageMetrics | undefined, delta?: {
    line?: number;
    branch?: number;
}, vsLabel?: string): string | undefined;
export declare function formatCoverageStatsTable(summary: CoverageMetrics, projects?: Record<string, CoverageMetrics>): string;
//# sourceMappingURL=coverage-stats.d.ts.map