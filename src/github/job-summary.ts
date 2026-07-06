import * as core from '@actions/core';
import type { TestRun } from '../model/test-run';
import { formatDuration } from '../model/test-run';

export async function writeJobSummary(run: TestRun, reportUrl: string | undefined): Promise<void> {
  const { stats, status } = run;
  const emoji = status === 'passed' ? '✅' : '❌';
  const failures = run.tests.filter((t) => t.outcome === 'failed').slice(0, 20);

  let summary = `## ${emoji} Actions Insights Test Report

| Metric | Value |
|--------|-------|
| Status | **${status.toUpperCase()}** |
| Total | ${stats.total.toLocaleString()} |
| Passed | ${stats.passed.toLocaleString()} |
| Failed | ${stats.failed.toLocaleString()} |
| Skipped | ${stats.skipped.toLocaleString()} |
| Duration | ${formatDuration(stats.durationMs)} |
| Success Rate | ${stats.successRate}% |
`;

  if (reportUrl) {
    summary += `\n[View Full Report](${reportUrl})\n`;
  }

  if (failures.length > 0) {
    summary += `\n### Failed Tests\n\n`;
    for (const test of failures) {
      summary += `- \`${test.fullName}\`${test.message ? ` — ${test.message}` : ''}\n`;
    }
    if (run.stats.failed > failures.length) {
      summary += `\n_...and ${run.stats.failed - failures.length} more_\n`;
    }
  }

  await core.summary.addRaw(summary).write();
}
