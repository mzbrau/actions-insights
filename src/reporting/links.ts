import type { RunContext } from '../model/test-run';
import type { TestCase } from '../model/test-case';
import { getCodeSearchName } from './grouping';
import { escapeTableCell } from './markdown';

export interface ReportLinks {
  workflowRun: string;
  artifacts: string;
  commit: string;
  repository: string;
  pullRequest?: string;
  historyRepository?: string;
  historyRun?: string;
}

export function buildReportLinks(
  context: RunContext,
  options?: { artifactUrl?: string },
): ReportLinks {
  return {
    workflowRun: context.workflowUrl,
    artifacts: options?.artifactUrl ?? `${context.workflowUrl}#artifacts`,
    commit: context.commitUrl,
    repository: context.repositoryUrl,
    pullRequest: context.prUrl,
  };
}

export function buildTestCodeUrl(context: RunContext, test: TestCase): string | undefined {
  const searchName = getCodeSearchName(test);
  if (!searchName) return undefined;
  const q = `repo:${context.repository} ${searchName}`;
  return `https://github.com/search?q=${encodeURIComponent(q)}&type=code`;
}

export function formatTestNameWithLinks(
  context: RunContext,
  links: ReportLinks,
  shortName: string,
  test: TestCase,
): string {
  const logUrl = context.jobUrl || links.workflowRun;
  const log = `[\`${shortName}\`](${logUrl})`;
  const codeUrl = buildTestCodeUrl(context, test);
  return codeUrl ? `${log} ([code](${codeUrl}))` : log;
}

/** Job summary: link test name directly to code search (user is already on the workflow page). */
export function formatTestNameWithCodeLink(
  context: RunContext,
  shortName: string,
  test: TestCase,
): string {
  const codeUrl = buildTestCodeUrl(context, test);
  return codeUrl ? `[\`${shortName}\`](${codeUrl})` : `\`${shortName}\``;
}

/** Job summary tables: link without backticks and escape pipes in link text. */
export function formatTestNameWithCodeLinkForTable(
  context: RunContext,
  shortName: string,
  test: TestCase,
): string {
  const codeUrl = buildTestCodeUrl(context, test);
  const escaped = escapeTableCell(shortName);
  return codeUrl ? `[${escaped}](${codeUrl})` : escaped;
}

export function formatHistoryDetailsLink(url: string): string {
  return `[Details](${url})`;
}

export function formatFooterLinks(links: ReportLinks): string {
  const items = [
    `[Workflow run](${links.workflowRun})`,
    `[Report](${links.artifacts})`,
    `[Commit](${links.commit})`,
  ];
  if (links.pullRequest) {
    items.push(`[Pull request](${links.pullRequest})`);
  }
  if (links.historyRepository) {
    items.push(`[Test history](${links.historyRepository})`);
  }
  if (links.historyRun) {
    items.push(formatHistoryDetailsLink(links.historyRun));
  }
  items.push(`[Repository](${links.repository})`);
  return `Actions Insights · ${items.join(' · ')}`;
}
