import type { RunManifestEntry } from '../model/manifest';
export interface RetentionOptions {
    historyLimit: number;
    retainDays: number;
}
export declare function pruneRuns(runs: RunManifestEntry[], options: RetentionOptions, now?: number): RunManifestEntry[];
export declare function pruneRunDirectories(branchDir: string, retainedRunIds: Set<string>): string[];
export declare function copyDirectorySync(src: string, dest: string): void;
export declare function syncLatestDirectory(runDir: string, latestDir: string): void;
//# sourceMappingURL=retention.d.ts.map