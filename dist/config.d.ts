export type PagesMode = 'artifact' | 'gh-pages' | 'none';
export type ThemeMode = 'light' | 'dark' | 'auto';
export interface ActionConfig {
    testResults: string;
    pagesSubdirectory: string;
    publishPages: boolean;
    pagesMode: PagesMode;
    commentPr: boolean;
    historyLimit: number;
    retainDays: number;
    reportTitle: string;
    reportOutput: string;
    siteOutput: string;
    theme: ThemeMode;
    slowTestThresholdMs: number;
    seedFromGhPages: boolean;
    githubToken: string;
}
export declare function loadConfig(): ActionConfig;
