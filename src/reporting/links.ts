import type { RunContext } from '../model/test-run';

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
  return items.join(' · ');
}
