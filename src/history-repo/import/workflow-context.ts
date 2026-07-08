import type { PublishRunContext } from '../publisher/paths';

export interface GitHubWorkflowRun {
  id: number;
  name?: string | null;
  head_branch?: string | null;
  head_sha: string;
  event: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  run_attempt?: number;
  path?: string;
  workflow_id?: number;
  display_title?: string;
  pull_requests?: Array<{
    number: number;
    base?: { ref?: string };
    head?: { ref?: string };
  }>;
  head_commit?: {
    message?: string;
    author?: { name?: string; email?: string };
  };
}

export function workflowRunToContext(
  repository: string,
  run: GitHubWorkflowRun,
  workflowName?: string,
): PublishRunContext {
  const repositoryUrl = `https://github.com/${repository}`;
  const workflowRunId = run.id;
  const workflowUrl = `${repositoryUrl}/actions/runs/${workflowRunId}`;
  const commitSha = run.head_sha;
  const commitShortSha = commitSha.slice(0, 7);
  const commitUrl = `${repositoryUrl}/commit/${commitSha}`;
  const pr = run.pull_requests?.[0];
  const prNumber = pr?.number;
  const prUrl = prNumber ? `${repositoryUrl}/pull/${prNumber}` : undefined;
  const baseBranch = pr?.base?.ref;

  let branch = run.head_branch ?? pr?.head?.ref ?? 'main';
  let ref = `refs/heads/${branch}`;
  let tag: string | undefined;

  if (run.event === 'push' && !run.head_branch && !prNumber) {
    const tagFromTitle = extractTagFromDisplayTitle(run.display_title);
    if (tagFromTitle) {
      tag = tagFromTitle;
      branch = tag;
      ref = `refs/tags/${tag}`;
    }
  }

  const commitMessage = (run.head_commit?.message ?? run.display_title ?? 'Workflow run')
    .split('\n')[0]
    .trim();
  const author =
    run.head_commit?.author?.name ?? run.head_commit?.author?.email ?? 'unknown';

  return {
    repository,
    repositoryUrl,
    workflow: workflowName ?? run.name ?? run.path ?? 'Workflow',
    workflowUrl,
    runId: workflowRunId,
    branch,
    ref,
    tag,
    prNumber,
    prUrl,
    baseBranch,
    commitSha,
    commitShortSha,
    commitMessage,
    commitUrl,
    author,
    actor: author,
    startedAt: run.created_at,
    completedAt: run.updated_at,
  };
}

function extractTagFromDisplayTitle(displayTitle?: string | null): string | undefined {
  if (!displayTitle) return undefined;
  const match = displayTitle.match(/^[^:]+:\s*(.+)$/);
  return match?.[1]?.trim();
}
