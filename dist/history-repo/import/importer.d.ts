export interface ImportHistoryOptions {
    token: string;
    sourceRepo: string;
    repoPath: string;
    dataPath: string;
    artifactNames: string[];
    artifactPatterns: string[];
    testResultsGlob: string;
    workflow?: string;
    branch?: string;
    since?: string;
    limit: number;
    historyLimit: number;
    retainDays: number;
    dryRun: boolean;
}
export interface ImportSkipReason {
    runId: number;
    reason: string;
}
export interface ImportHistoryResult {
    imported: number;
    skipped: number;
    skippedDetails: ImportSkipReason[];
    candidateCount: number;
    dryRun: boolean;
}
export declare function importHistory(options: ImportHistoryOptions): Promise<ImportHistoryResult>;
export declare function resolveGitHubToken(): string;
//# sourceMappingURL=importer.d.ts.map