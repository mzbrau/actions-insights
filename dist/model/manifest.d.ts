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
export interface SearchIndexEntry {
    i: number;
    tokens: string[];
}
export interface SearchIndex {
    fields: string[];
    entries: SearchIndexEntry[];
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