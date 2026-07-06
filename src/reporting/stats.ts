import type { TestCase } from '../model/test-case';
import type { RunStats } from '../model/test-run';
import { formatDuration } from '../model/test-run';

export interface ExtendedStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  successRate: number;
  averageDurationMs: number;
  longestDurationMs: number;
  longestTestName?: string;
}

export function computeExtendedStats(stats: RunStats, tests: TestCase[]): ExtendedStats {
  let longestDurationMs = 0;
  let longestTestName: string | undefined;
  for (const test of tests) {
    if (test.durationMs > longestDurationMs) {
      longestDurationMs = test.durationMs;
      longestTestName = test.fullName;
    }
  }
  const averageDurationMs = stats.total > 0 ? Math.round(stats.durationMs / stats.total) : 0;
  return {
    total: stats.total,
    passed: stats.passed,
    failed: stats.failed,
    skipped: stats.skipped,
    durationMs: stats.durationMs,
    successRate: stats.successRate,
    averageDurationMs,
    longestDurationMs,
    longestTestName,
  };
}

export function formatStatsTable(extended: ExtendedStats): string {
  return `| Metric | Value |
| --- | --- |
| Total | ${extended.total.toLocaleString()} |
| Passed | ${extended.passed.toLocaleString()} |
| Failed | ${extended.failed.toLocaleString()} |
| Skipped | ${extended.skipped.toLocaleString()} |
| Duration | ${formatDuration(extended.durationMs)} |
| Success rate | ${extended.successRate}% |
| Avg duration | ${formatDuration(extended.averageDurationMs)} |
| Longest test | ${formatDuration(extended.longestDurationMs)}${extended.longestTestName ? ` (\`${extended.longestTestName}\`)` : ''} |`;
}

export function formatCompactSummary(extended: ExtendedStats): string {
  const parts = [
    `✅ ${extended.passed.toLocaleString()} passed`,
    `❌ ${extended.failed.toLocaleString()} failed`,
    `⏭ ${extended.skipped.toLocaleString()} skipped`,
    `${extended.successRate}%`,
    formatDuration(extended.durationMs),
  ];
  return `**${parts.join(' · ')}**`;
}
