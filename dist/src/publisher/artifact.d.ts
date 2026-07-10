export declare const ARTIFACT_NAME = "actions-insights-report";
export declare function collectArtifactFiles(artifactDir: string): string[];
export declare function uploadReportArtifact(artifactDir: string, retentionDays: number, commitShortSha: string, options?: {
    includeRawTestResults?: boolean;
    matchedFiles?: string[];
    sourceFiles?: string[];
}): Promise<void>;
//# sourceMappingURL=artifact.d.ts.map