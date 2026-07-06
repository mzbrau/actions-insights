import type { ActionConfig } from '../config';
import type { PreviousRun } from '../history/previous-run';
import type { ReportingContext } from './context';
import { computeTestDelta, formatDeltaSection } from './delta';
import { formatGroupedFailures } from './failures';
import { getShortTestName, groupTestsByClass } from './grouping';
import { formatFooterLinks, type ReportLinks } from './links';
import { formatSlowTestsSection, SLOW_TOTAL } from './slow-tests';
import { formatCommentStatsTable, formatCompactSummary } from './stats';

export const COMMENT_MARKER = '<!-- actions-insights-report -->';

export function renderPrComment(
  ctx: ReportingContext,
  config: ActionConfig,
  links: ReportLinks,
): string {
  const { run, failedTests, failedCount, slowTests, extendedStats, previousRun } = ctx;
  const { context, status } = run;
  const emoji = status === 'passed' ? '✅' : '❌';
  const statusLabel = status === 'passed' ? 'Passed' : 'Failed';
  const timestamp = new Date(context.completedAt).toISOString().replace('T', ' ').slice(0, 19);

  const failureOptions = {
    maxStackTraceLines: config.maxStackTraceLines,
    includeStdout: config.includeStdout,
    includeStderr: config.includeStderr,
    compact: true as const,
  };

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

  const delta = computeTestDelta(run.tests, previousRun, context.commitSha);
  const deltaSection = formatDeltaSection(delta, previousRun, context.repositoryUrl);
  if (deltaSection) {
    lines.push(deltaSection);
    lines.push('');
  }

  if (failedCount > 0) {
    lines.push(`### Failed Tests (${failedCount.toLocaleString()})`);
    lines.push('');
    lines.push(
      ...formatGroupedFailures(
        failedTests,
        config.maxFailedTestsInComment,
        failureOptions,
        getShortTestName,
        groupTestsByClass,
      ),
    );
    const remaining = failedCount - Math.min(failedCount, config.maxFailedTestsInComment);
    if (remaining > 0) {
      lines.push(`_…and ${remaining.toLocaleString()} additional failed test${remaining === 1 ? '' : 's'}._`);
      lines.push('');
      lines.push(`[View complete report in workflow artifacts](${links.artifacts})`);
      lines.push('');
    }
  }

  if (config.includeSlowestTests > 0 && slowTests.length > 0) {
    const slowLimit = Math.min(config.includeSlowestTests, SLOW_TOTAL);
    const selectedSlow = slowTests.slice(0, slowLimit);
    lines.push(
      ...formatSlowTestsSection(selectedSlow, config.slowTestThresholdMs, {
        splitCollapsed: true,
        getShortName: getShortTestName,
      }),
    );
  }

  lines.push('### Statistics');
  lines.push('');
  lines.push(formatCommentStatsTable(extendedStats));
  lines.push('');
  lines.push('---');
  lines.push(formatFooterLinks(links));

  return lines.join('\n');
}
