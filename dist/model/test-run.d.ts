import type { TestCase, TestOutcome } from './test-case';
export type RunStatus = 'passed' | 'failed';
export interface RunStats {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    inconclusive: number;
    durationMs: number;
    successRate: number;
}
export interface RunContext {
    repository: string;
    repositoryUrl: string;
    workflow: string;
    workflowUrl: string;
    jobUrl?: string;
    runId: number;
    runAttempt: number;
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
export interface TestRun {
    id: string;
    title: string;
    status: RunStatus;
    stats: RunStats;
    tests: TestCase[];
    context: RunContext;
    sourceFiles: string[];
    reportPath: string;
}
export declare function computeStats(tests: TestCase[]): RunStats;
export declare function deriveStatus(tests: TestCase[]): RunStatus;
export declare function formatDuration(ms: number): string;
export declare function outcomeLabel(outcome: TestOutcome): string;
//# sourceMappingURL=test-run.d.ts.map