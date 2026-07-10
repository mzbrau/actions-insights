export interface RawManifestEntry {
    artifactPath: string;
    sourcePath: string;
    parsed: boolean;
}
export interface RawManifest {
    version: 1;
    files: RawManifestEntry[];
}
export declare function copyRawTestResults(matchedFiles: string[], sourceFiles: string[], artifactDir: string, workspaceRoot?: string): RawManifestEntry[];
export declare function writeRawManifest(artifactDir: string, entries: RawManifestEntry[]): void;
//# sourceMappingURL=raw-results.d.ts.map