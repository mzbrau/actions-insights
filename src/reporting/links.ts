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
  const sourceFile = (test.sourceFile ?? '').trim().replace(/^\/+/, '');
  if (!sourceFile) return undefined;
  return `${context.repositoryUrl}/blob/${context.commitSha}/${sourceFile}`;
}

export function formatTestNameWithLinks(
  context: RunContext,
  links: ReportLinks,
  shortName: string,
  test: TestCase,
): string {
  const log = `[\`${shortName}\`](${links.workflowRun})`;
  const codeUrl = buildTestCodeUrl(context, test);
  return codeUrl ? `${log} ([code](${codeUrl}))` : log;
}

export function formatFooterLinks(links: ReportLinks): string {
  const items = [
    `[Workflow run](${links.workflowRun})`,
    `[Artifacts](${links.artifacts})`,
    `[Commit](${links.commit})`,
  ];
  if (links.pullRequest) {
    items.push(`[Pull request](${links.pullRequest})`);
  }
  items.push(`[Repository](${links.repository})`);
  return `Actions Insights · ${items.join(' · ')}`;
}
