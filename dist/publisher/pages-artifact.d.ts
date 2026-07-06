export declare function restoreSiteCache(siteOutput: string, owner: string, repo: string): Promise<boolean>;
export declare function saveSiteCache(siteOutput: string, owner: string, repo: string): Promise<void>;
export declare function seedFromGhPagesBranch(siteOutput: string, token: string): Promise<boolean>;
export declare function prepareSiteWorkspace(siteOutput: string, owner: string, repo: string, seedFromGhPages: boolean, token: string): Promise<void>;
export declare function uploadPagesArtifact(siteOutput: string): Promise<void>;
//# sourceMappingURL=pages-artifact.d.ts.map