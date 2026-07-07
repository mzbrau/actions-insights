import type { BranchHistory } from '@actions-insights/history-models';
export interface RetentionOptions {
    historyLimit: number;
    retainDays: number;
}
export declare function pruneBranchHistory(history: BranchHistory, options: RetentionOptions): BranchHistory;
export declare function listOrphanedRunFiles(history: BranchHistory, existingRunFiles: string[]): string[];
//# sourceMappingURL=retention.d.ts.map