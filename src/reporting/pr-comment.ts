import type { ActionConfig } from '../config';
import { formatDuration } from '../model/test-run';
import type { ReportingContext } from './context';
import { formatFailureBlock } from './failures';
import { formatFooterLinks, type ReportLinks } from './links';
import { formatSlowTestLine } from './slow-tests';
import { formatCompactSummary, formatStatsTable } from './stats';

export const COMMENT_MARKER = '<!-- actions-insights-report -->';

export function renderPrComment(
  ctx: ReportingContext,
  config: ActionConfig,
  links: ReportLinks,
): string {
  const { run, failedTests, failedCount, slowTests, extendedStats } = ctx;
  const { context, status } = run;
  const emoji = status === 'passed' ? '✅' : '❌';
  const statusLabel = status === 'passed' ? 'Passed' : 'Failed';
  const timestamp = new Date(context.completedAt).toISOString().replace('T', ' ').slice(0, 19);

  const lines: string[] = [
    COMMENT_MARKER,
    `## ${emoji} ${statusLabel} — ${config.reportTitle}`,
    '',
    `**${context.repository}** · \`${context.workflow}\` · \`${context.branch}\``,
    `\`${context.commitShortSha}\` ${context.commitMessage} · ${context.author} · ${timestamp}`,
    '',
    formatCompactSummary(extendedStats),
    '',
  ];

  if (failedCount > 0) {
    const shown = failedTests.slice(0, config.maxFailedTestsInComment);
    lines.push(`### Failed Tests (${failedCount.toLocaleString()})`);
    lines.push('');
    for (const test of shown) {
      lines.push(formatFailureBlock(test, {
        maxStackTraceLines: config.maxStackTraceLines,
        includeStdout: config.includeStdout,
        includeStderr: config.includeStderr,
        compact: true,
      }));
      lines.push('');
    }
    const remaining = failedCount - shown.length;
    if (remaining > 0) {
      lines.push(`_…and ${remaining.toLocaleString()} additional failed test${remaining === 1 ? '' : 's'}._`);
      lines.push('');
      lines.push(`[View complete report in workflow artifacts](${links.artifacts})`);
      lines.push('');
    }
  }

  if (config.includeSlowestTests > 0 && slowTests.length > 0) {
    lines.push(`### Slowest Tests`);
    lines.push('');
    for (const test of slowTests) {
      lines.push(`- ${formatSlowTestLine(test, config.slowTestThresholdMs)}`);
    }
    lines.push('');
  }

  lines.push('### Statistics');
  lines.push('');
  lines.push(formatStatsTable(extendedStats));
  lines.push('');
  lines.push('---');
  lines.push(formatFooterLinks(links));

  return lines.join('\n');
}
