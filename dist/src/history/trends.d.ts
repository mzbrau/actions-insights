import type { RunManifestEntry, TrendData } from '../model/manifest';
import type { RunStatus } from '../model/test-run';
export declare function buildTrendData(key: string, runs: RunManifestEntry[]): TrendData;
export declare function detectNewFailures(currentFailed: string[], previousFailed: string[] | undefined): Set<string>;
export declare function readPreviousFailedTests(manifestPath: string): string[] | undefined;
export declare function statusFromCounts(failed: number): RunStatus;
//# sourceMappingURL=trends.d.ts.map