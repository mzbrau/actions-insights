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

export function toTimingSummaryCompact(report: WorkflowTimingReport): TimingSummaryCompact {
  return {
    workflowDurationMs: report.summary.workflowDurationMs,
    slowestStep: report.summary.slowestStep,
  };
}

export function findSlowestStep(steps: WorkflowStepTiming[]): string | undefined {
  if (steps.length === 0) return undefined;
  let slowest = steps[0];
  for (const step of steps) {
    if (step.durationMs > slowest.durationMs) slowest = step;
  }
  return `${slowest.jobName} › ${slowest.stepName}`;
}

export function encodeTimingRunRecord(
  runId: string,
  report: WorkflowTimingReport,
): TimingRunRecord {
  return {
    version: HISTORY_SCHEMA_VERSION,
    runId,
    summary: report.summary,
    runner: report.runner,
  };
}

export function normalizeTimingRunRecord(raw: unknown): TimingRunRecord {
  const record = raw as TimingRunRecord;
  return {
    version: HISTORY_SCHEMA_VERSION,
    runId: record.runId,
    summary: {
      workflowDurationMs: record.summary?.workflowDurationMs,
      jobs: record.summary?.jobs ?? [],
      steps: record.summary?.steps ?? [],
      actionPhases: record.summary?.actionPhases,
      slowestStep: record.summary?.slowestStep,
    },
    runner: record.runner,
  };
}

export function durationBetweenMs(startedAt?: string | null, completedAt?: string | null): number {
  if (!startedAt || !completedAt) return 0;
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return end - start;
}
