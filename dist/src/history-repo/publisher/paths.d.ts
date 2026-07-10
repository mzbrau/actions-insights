import type { BranchType } from '../models';
export interface PublishRunContext {
    repository: string;
    repositoryUrl: string;
    workflow: string;
    workflowUrl: string;
    jobUrl?: string;
    runId: number;
    branch: string;
    ref: string;
    tag?: string;
    prNumber?: number;
    prUrl?: string;
    baseBranch?: string;
    commitSha: string;
    commitShortSha: string;
    commitMessage: string;
    commitUrl: string;
    author: string;
    actor: string;
    startedAt: string;
    completedAt: string;
}
export interface PublishTestCase {
    name: string;
    fullName: string;
    outcome: 'passed' | 'failed' | 'skipped' | 'inconclusive';
    durationMs: number;
    assembly?: string;
    namespace?: string;
    className?: string;
    method?: string;
    message?: string;
    stackTrace?: string;
    stdout?: string;
    stderr?: string;
    isNewFailure?: boolean;
}
import type { CoverageReport } from '../models';
export interface PublishTestRun {
    id: string;
    status: 'passed' | 'failed';
    stats: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        inconclusive: number;
        durationMs: number;
        successRate: number;
    };
    tests: PublishTestCase[];
    context: PublishRunContext;
    coverage?: CoverageReport;
}
export declare function sanitizeBranchKey(branch: string): string;
export declare function resolveBranchKey(context: PublishRunContext): {
    branchKey: string;
    branchLabel: string;
    branchType: BranchType;
};
export declare function resolveRepositoryKey(repositoryName: string): string;
export declare function formatRunFileName(date: string, runId: string): string;
export interface HistoryPaths {
    dataRoot: string;
    repositoriesIndex: string;
    configFile: string;
    repoDir: string;
    metadata: string;
    branchesIndex: string;
    branchDir: string;
    branchLatest: string;
    branchHistory: string;
    branchRunsDir: string;
    runFile: string;
    runFileName: string;
    coverageFile?: string;
    coverageFileName?: string;
    testsFile: string;
    prDir?: string;
}
export declare function resolveHistoryPaths(dataPath: string, repositoryKey: string, branchKey: string, runFileName: string, prNumber?: number): HistoryPaths;
//# sourceMappingURL=paths.d.ts.map