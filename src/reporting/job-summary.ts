import type { ActionConfig } from '../config';
import type { ReportingContext } from './context';
import { formatJobSummaryTestTables } from './all-tests-summary';
import { formatGroupedFailures } from './failures';
import { getShortTestName, groupTestsByClass } from './grouping';
import { formatFooterLinks, formatTestNameWithCodeLink, formatTestNameWithCodeLinkForTable, type ReportLinks } from './links';
import { formatSkippedTestLine, formatSlowTestsSection } from './slow-tests';
import { formatCommentStatsTable, formatCompactSummary } from './stats';
import { formatUtcTimestamp } from './time';

function formatHeaderMetadata(ctx: ReportingContext): string[] {
  const { run } = ctx;
  const timestamp = formatUtcTimestamp(run.context.completedAt);
  return [
    `**${run.context.repository}** · \`${run.context.workflow}\` · \`${run.context.branch}\``,
    `\`${run.context.commitShortSha}\` ${run.context.commitMessage} · ${run.context.author} · ${timestamp}`,
  ];
}

export function renderJobSummary(
  ctx: ReportingContext,
  config: ActionConfig,
  links: ReportLinks,
): string {
  const { run, failedTests, failedCount, slowTests, skippedTests } = ctx;
  const emoji = run.status === 'passed' ? '✅' : '❌';

  const failureOptions = {
    maxStackTraceLines: config.maxStackTraceLines,
    includeStdout: config.includeStdout,
    includeStderr: config.includeStderr,
    compact: false as const,
  };

  const lines: string[] = [
    `# ${emoji} ${config.reportTitle}`,
    '',
    ...formatHeaderMetadata(ctx),
    '',
    formatCompactSummary(ctx.extendedStats),
    '',
    `[Report](${links.artifacts})`,
    '',
  ];

  const formatTestName = (t: Parameters<typeof formatTestNameWithCodeLink>[2]) =>
    formatTestNameWithCodeLink(run.context, getShortTestName(t), t);

  const formatTableTestName = (t: Parameters<typeof formatTestNameWithCodeLinkForTable>[2]) =>
    formatTestNameWithCodeLinkForTable(run.context, getShortTestName(t), t);

  if (failedCount > 0) {
    lines.push(`## Failed Tests (${failedCount.toLocaleString()})`);
    lines.push('');
    lines.push(
      ...formatGroupedFailures(
        failedTests,
        config.maxFailedTestsInSummary,
        failureOptions,
        formatTestName,
        groupTestsByClass,
      ),
    );
    const remaining = failedCount - Math.min(failedCount, config.maxFailedTestsInSummary);
    if (remaining > 0) {
      lines.push(`_…and ${remaining.toLocaleString()} more failed test${remaining === 1 ? '' : 's'}. [View report](${links.artifacts})_`);
      lines.push('');
    }
  }

  if (config.includeSlowestTests > 0 && slowTests.length > 0) {
    lines.push(
      ...formatSlowTestsSection(slowTests, config.slowTestThresholdMs, {
        formatName: formatTestName,
      }),
    );
  }

  if (skippedTests.length > 0) {
    const shown = skippedTests.slice(0, 10);
    lines.push(`## Skipped Tests (${skippedTests.length.toLocaleString()})`);
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

  lines.push(...formatJobSummaryTestTables(run.tests, run.sourceFiles, links, formatTableTestName));

  lines.push('## Statistics');
  lines.push('');
  lines.push(formatCommentStatsTable(ctx.extendedStats));
  lines.push('');
  lines.push('---');
  lines.push(formatFooterLinks(links));

  return lines.join('\n');
}
