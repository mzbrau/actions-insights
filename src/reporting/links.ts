import type { RunContext } from '../model/test-run';
import type { TestCase } from '../model/test-case';

export interface ReportLinks {
  workflowRun: string;
  artifacts: string;
  commit: string;
  repository: string;
  pullRequest?: string;
}

export function buildReportLinks(context: RunContext): ReportLinks {
  return {
    workflowRun: context.workflowUrl,
    artifacts: `${context.workflowUrl}#artifacts`,
    commit: context.commitUrl,
    repository: context.repositoryUrl,
    pullRequest: context.prUrl,
  };
}

export function buildTestCodeUrl(context: RunContext, test: TestCase): string | undefined {
  // Test results often contain runner absolute paths in sourceFile. Prefer a repo code search.
  const shortName = (test.method ?? test.name ?? '').trim();
  const q = `repo:${context.repository} ${shortName || test.fullName}`;
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

export function formatFooterLinks(links: ReportLinks): string {
  const items = [
    `[Workflow run](${links.workflowRun})`,
    `[Report](${links.artifacts})`,
    `[Commit](${links.commit})`,
  ];
  if (links.pullRequest) {
    items.push(`[Pull request](${links.pullRequest})`);
  }
  items.push(`[Repository](${links.repository})`);
  return `Actions Insights · ${items.join(' · ')}`;
}
