export interface ArtifactDownloadOptions {
    repository: string;
    runId: number;
    artifactNames: string[];
    artifactPatterns: string[];
    testResultsGlob: string;
    token: string;
}
export interface ArtifactProbeResult {
    artifactName: string;
    downloadDir: string;
    sourceFiles: string[];
}
export declare function findParseableArtifact(options: ArtifactDownloadOptions): Promise<ArtifactProbeResult | undefined>;
export declare function cleanupArtifactDir(downloadDir: string): void;
//# sourceMappingURL=artifacts.d.ts.map