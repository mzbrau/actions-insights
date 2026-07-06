import type { TestCase } from '../model/test-case';
import type { RunStats } from '../model/test-run';
export interface ExtendedStats {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
    successRate: number;
    averageDurationMs: number;
    longestDurationMs: number;
    longestTestName?: string;
}
export declare function computeExtendedStats(stats: RunStats, tests: TestCase[]): ExtendedStats;
export declare function formatStatsTable(extended: ExtendedStats): string;
export declare function formatCompactSummary(extended: ExtendedStats): string;
//# sourceMappingURL=stats.d.ts.map