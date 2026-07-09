import type { ExistingHistoryState, HistoryFileWrite, HistoryUpdateResult } from '../publisher/build-update';
export declare function writeHistoryUpdate(workDir: string, update: HistoryUpdateResult): void;
export declare function mergeUpdateIntoExisting(existing: ExistingHistoryState, update: HistoryUpdateResult): ExistingHistoryState;
export declare function collectCommitPaths(workDir: string, files: HistoryFileWrite[]): string[];
//# sourceMappingURL=apply-update.d.ts.map