import type { RunStatus } from './test-run';
export interface RunManifestEntry {
    runId: string;
    workflowRunId: number;
    status: RunStatus;
    date: string;
    durationMs: number;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    commitSha: string;
    commitShortSha: string;
    commitMessage: string;
    author: string;
    path: string;
    isLatest?: boolean;
}
export interface BranchManifest {
    key: string;
    label: string;
    type: 'branch' | 'pr' | 'tag';
    runs: RunManifestEntry[];
    latestPath: string;
}
export interface SiteManifest {
    updatedAt: string;
    repository: string;
    branches: BranchManifest[];
}
export interface TrendPoint {
    runId: string;
    date: string;
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
    status: RunStatus;
}
export interface TrendData {
    key: string;
    points: TrendPoint[];
    averagePassRate: number;
    averageDurationMs: number;
    failuresLast24h: number;
    totalRuns: number;
}
export interface TestHistoryPoint {
    runId: string;
    date: string;
    o: number;
    d: number;
    commitShortSha: string;
    branchKey: string;
    branchLabel: string;
}
export interface TestHistoryEntry {
    passRate: number;
    runCount: number;
    points: TestHistoryPoint[];
}
export interface TrendsFile {
    version: 1;
    repository: string;
    updatedAt: string;
    context: {
        branchKey: string;
        branchLabel: string;
    };
    runs: RunManifestEntry[];
    summary: TrendData;
    tests: Record<string, TestHistoryEntry>;
}
export interface CanonicalRunEntry extends RunManifestEntry {
    branchKey: string;
    branchLabel: string;
    branchType: 'branch' | 'pr' | 'tag';
    failedTests: string[];
    testOutcomes: Array<{
        n: string;
        o: number;
        d: number;
    }>;
}
export interface CanonicalRunsFile {
    version: 1;
    repository: string;
    updatedAt: string;
    runs: CanonicalRunEntry[];
}
export interface CanonicalTestsFile {
    version: 1;
    tests: Record<string, TestHistoryPoint[]>;
}
export interface CanonicalHistory {
    runs: CanonicalRunsFile;
    tests: CanonicalTestsFile;
}
export interface CompactTestRecord {
    i: number;
    n: string;
    o: number;
    d: number;
    a?: string;
    ns?: string;
    c?: string;
    m?: string;
    st?: string;
    nf?: boolean;
}
export declare const OUTCOME_TO_CODE: Record<string, number>;
export declare const CODE_TO_OUTCOME: readonly ["passed", "failed", "skipped", "inconclusive"];
//# sourceMappingURL=manifest.d.ts.map