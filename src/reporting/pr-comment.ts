import type { ActionConfig } from '../config';
import type { PreviousRun } from '../history/previous-run';
import type { ReportingContext } from './context';
import { computeTestDelta, formatDeltaSection, BASE_BRANCH_DELTA_CONFIG, PUSH_DELTA_CONFIG, buildBaseBranchDeltaHeading, buildPushDeltaHeading } from './delta';
import { formatGroupedFailures } from './failures';
import { getShortTestName, groupTestsByClass } from './grouping';
import { formatFooterLinks, formatTestNameWithLinks, type ReportLinks } from './links';
import { formatSlowTestsSection, SLOW_TOTAL } from './slow-tests';
import { formatCommentStatsTable, formatCompactSummary } from './stats';
import { formatUtcTimestamp } from './time';

export const COMMENT_MARKER = '<!-- actions-insights-report -->';

export function renderPrComment(
  ctx: ReportingContext,
  config: ActionConfig,
  links: ReportLinks,
): string {
  const { run, failedTests, failedCount, slowTests, extendedStats, previousRun, baseBranchRun } = ctx;
  const { context, status } = run;
  const emoji = status === 'passed' ? '✅' : '❌';
  const statusLabel = status === 'passed' ? 'Passed' : 'Failed';
  const timestamp = formatUtcTimestamp(context.completedAt);

  const failureOptions = {
    maxStackTraceLines: config.maxStackTraceLines,
    includeStdout: config.includeStdout,
    includeStderr: config.includeStderr,
    compact: true as const,
  };

  const lines: string[] = [
    COMMENT_MARKER,
    `# ${emoji} ${statusLabel} — ${config.reportTitle}`,
    '',
    `**${context.repository}** · \`${context.workflow}\` · \`${context.branch}\``,
    `\`${context.commitShortSha}\` ${context.commitMessage} · ${context.author} · ${timestamp}`,
    '',
    formatCompactSummary(extendedStats),
    '',
  ];

  const deltaOptions = {
    slowdownRatio: 1.5,
    slowdownMinMs: Math.max(100, Math.floor(config.slowTestThresholdMs / 5)),
  };

  if (context.prNumber && baseBranchRun && baseBranchRun.commitSha !== context.commitSha) {
    const baseDelta = computeTestDelta(run.tests, baseBranchRun, context.commitSha, deltaOptions);
    const baseBranchLabel = context.baseBranch ?? 'main';
    const baseSection = formatDeltaSection(baseDelta, baseBranchRun, {
      ...BASE_BRANCH_DELTA_CONFIG,
      heading: buildBaseBranchDeltaHeading(
        baseBranchLabel,
        baseBranchRun.commitSha,
        context.repositoryUrl,
      ),
    });
    if (baseSection) {
      lines.push(baseSection);
      lines.push('');
    }
  }

  if (previousRun && previousRun.commitSha !== context.commitSha) {
    const pushDelta = computeTestDelta(run.tests, previousRun, context.commitSha, deltaOptions);
    const pushSection = formatDeltaSection(pushDelta, previousRun, {
      ...PUSH_DELTA_CONFIG,
      heading: buildPushDeltaHeading(
        previousRun.commitShortSha,
        previousRun.commitSha,
        context.repositoryUrl,
      ),
    });
    if (pushSection) {
      lines.push(pushSection);
      lines.push('');
    }
  }

  if (failedCount > 0) {
    lines.push(`## Failed Tests (${failedCount.toLocaleString()})`);
    lines.push('');
    lines.push(
      ...formatGroupedFailures(
        failedTests,
        config.maxFailedTestsInComment,
        failureOptions,
        (t) => formatTestNameWithLinks(context, links, getShortTestName(t), t),
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
        formatName: (t) => formatTestNameWithLinks(context, links, getShortTestName(t), t),
      }),
    );
  }

  lines.push('## Statistics');
  lines.push('');
  lines.push(formatCommentStatsTable(extendedStats));
  lines.push('');
  lines.push('---');
  lines.push(formatFooterLinks(links));

  return lines.join('\n');
}
