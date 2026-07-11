import { HISTORY_SCHEMA_VERSION } from './index';
export interface WorkflowStepTiming {
    jobName: string;
    stepName: string;
    stepNumber: number;
    status: string;
    durationMs: number;
    startedAt?: string;
    completedAt?: string;
}
export interface WorkflowJobTiming {
    name: string;
    durationMs: number;
    startedAt?: string;
    completedAt?: string;
}
export interface WorkflowTimingSummary {
    workflowDurationMs?: number;
    jobs: WorkflowJobTiming[];
    steps: WorkflowStepTiming[];
    actionPhases?: Record<string, number>;
    slowestStep?: string;
}
export interface WorkflowRunnerInfo {
    os?: string;
    labels?: string[];
}
export interface WorkflowTimingReport {
    summary: WorkflowTimingSummary;
    runner?: WorkflowRunnerInfo;
}
export interface TimingRunRecord {
    version: typeof HISTORY_SCHEMA_VERSION;
    runId: string;
    summary: WorkflowTimingSummary;
    runner?: WorkflowRunnerInfo;
}
export interface TimingSummaryCompact {
    workflowDurationMs?: number;
    slowestStep?: string;
}
export declare function toTimingSummaryCompact(report: WorkflowTimingReport): TimingSummaryCompact;
export declare function findSlowestStep(steps: WorkflowStepTiming[]): string | undefined;
export declare function encodeTimingRunRecord(runId: string, report: WorkflowTimingReport): TimingRunRecord;
export declare function normalizeTimingRunRecord(raw: unknown): TimingRunRecord;
export declare function durationBetweenMs(startedAt?: string | null, completedAt?: string | null): number;
//# sourceMappingURL=timing.d.ts.map