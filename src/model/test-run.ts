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

export function computeStats(tests: TestCase[]): RunStats {
  const passed = tests.filter((t) => t.outcome === 'passed').length;
  const failed = tests.filter((t) => t.outcome === 'failed').length;
  const skipped = tests.filter((t) => t.outcome === 'skipped').length;
  const inconclusive = tests.filter((t) => t.outcome === 'inconclusive').length;
  const total = tests.length;
  const durationMs = tests.reduce((sum, t) => sum + t.durationMs, 0);
  const successRate = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;
  return { total, passed, failed, skipped, inconclusive, durationMs, successRate };
}

export function deriveStatus(tests: TestCase[]): RunStatus {
  return tests.some((t) => t.outcome === 'failed') ? 'failed' : 'passed';
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60) return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

export function outcomeLabel(outcome: TestOutcome): string {
  switch (outcome) {
    case 'passed':
      return 'Passed';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    case 'inconclusive':
      return 'Inconclusive';
  }
}
