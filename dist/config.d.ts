export type ThemeMode = 'light' | 'dark' | 'auto';
export type CommentMode = 'update' | 'off';
export interface ActionConfig {
    testResults: string;
    reportsSubdirectory: string;
    commentMode: CommentMode;
    historyLimit: number;
    retainDays: number;
    reportTitle: string;
    reportOutput: string;
    siteOutput: string;
    theme: ThemeMode;
    slowTestThresholdMs: number;
    githubToken: string;
    maxFailedTestsInComment: number;
    maxFailedTestsInSummary: number;
    maxStackTraceLines: number;
    includeStdout: boolean;
    includeStderr: boolean;
    includeSlowestTests: number;
    uploadHtmlReport: boolean;
    generateJobSummary: boolean;
    publishChecks: boolean;
    artifactRetentionDays: number;
    checkName: string;
}
export declare function loadConfig(): ActionConfig;
