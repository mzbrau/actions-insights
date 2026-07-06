import type { ActionConfig } from '../config';
import type { ReportingContext } from './context';
import { formatFailureTableRow } from './failures';
import { formatFooterLinks, type ReportLinks } from './links';
import { formatSkippedTestLine, formatSlowTestTableRow } from './slow-tests';
import { formatStatsTable } from './stats';

export function renderJobSummary(
  ctx: ReportingContext,
  config: ActionConfig,
  links: ReportLinks,
): string {
  const { run, failedTests, failedCount, slowTests, skippedTests } = ctx;
  const emoji = run.status === 'passed' ? '✅' : '❌';

  const lines: string[] = [
    `## ${emoji} ${config.reportTitle}`,
    '',
    `| | |`,
    `| --- | --- |`,
    `| **Status** | **${run.status.toUpperCase()}** |`,
    `| Repository | ${run.context.repository} |`,
    `| Workflow | [${run.context.workflow}](${run.context.workflowUrl}) |`,
    `| Branch | \`${run.context.branch}\` |`,
    `| Commit | [\`${run.context.commitShortSha}\`](${run.context.commitUrl}) ${run.context.commitMessage} |`,
    '',
    formatStatsTable(ctx.extendedStats),
    '',
  ];

  if (failedCount > 0) {
    const shown = failedTests.slice(0, config.maxFailedTestsInSummary);
    lines.push(`### Failed Tests (${failedCount.toLocaleString()})`);
    lines.push('');
    lines.push('| Test | Class | Duration | Details |');
    lines.push('| --- | --- | --- | --- |');
    for (const test of shown) {
      lines.push(formatFailureTableRow(test, {
        maxStackTraceLines: config.maxStackTraceLines,
        includeStdout: config.includeStdout,
        includeStderr: config.includeStderr,
      }));
    }
    const remaining = failedCount - shown.length;
    if (remaining > 0) {
      lines.push('');
      lines.push(`_…and ${remaining.toLocaleString()} more failed test${remaining === 1 ? '' : 's'}. [View artifacts](${links.artifacts})_`);
    }
    lines.push('');
  }

  if (config.includeSlowestTests > 0 && slowTests.length > 0) {
    lines.push('### Slowest Tests');
    lines.push('');
    lines.push('| Test | Duration | Status |');
    lines.push('| --- | --- | --- |');
    for (const test of slowTests) {
      lines.push(formatSlowTestTableRow(test, config.slowTestThresholdMs));
    }
    lines.push('');
  }

  if (skippedTests.length > 0) {
    const shown = skippedTests.slice(0, 10);
    lines.push(`### Skipped Tests (${skippedTests.length.toLocaleString()})`);
    lines.push('');
    if (skippedTests.length <= 10) {
      for (const test of shown) {
        lines.push(formatSkippedTestLine(test));
      }
    } else {
      lines.push('<details><summary>Show skipped tests</summary>');
      lines.push('');
      for (const test of shown) {
        lines.push(formatSkippedTestLine(test));
      }
      lines.push('');
      lines.push(`_…and ${(skippedTests.length - 10).toLocaleString()} more._`);
      lines.push('');
      lines.push('</details>');
    }
    lines.push('');
  }

  lines.push('### Links');
  lines.push('');
  lines.push(formatFooterLinks(links));

  return lines.join('\n');
}
