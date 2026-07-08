import * as github from '@actions/github';
import type { GitHubWorkflowRun } from './workflow-context';

export interface ListWorkflowRunsOptions {
  token: string;
  repository: string;
  workflow?: string;
  branch?: string;
  since?: string;
  limit: number;
}

export interface ListWorkflowRunsResult {
  runs: GitHubWorkflowRun[];
  workflows: Map<number, string>;
}

export async function listWorkflowRuns(
  options: ListWorkflowRunsOptions,
): Promise<ListWorkflowRunsResult> {
  const [owner, repo] = options.repository.split('/');
  const octokit = github.getOctokit(options.token);
  const workflows = await loadWorkflowNameMap(octokit, owner, repo);

  const runs: GitHubWorkflowRun[] = [];
  let page = 1;
  const sinceMs = options.since ? Date.parse(options.since) : undefined;

  while (runs.length < options.limit) {
    const perPage = Math.min(100, options.limit - runs.length);
    const response = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      branch: options.branch,
      status: 'completed',
      per_page: perPage,
      page,
    });

    const batch = response.data.workflow_runs as GitHubWorkflowRun[];
    if (batch.length === 0) break;

    for (const run of batch) {
      if (sinceMs !== undefined && Date.parse(run.created_at) < sinceMs) {
        return { runs, workflows };
      }
      if (options.workflow && !matchesWorkflowFilter(run, workflows, options.workflow)) {
        continue;
      }
      runs.push(run);
      if (runs.length >= options.limit) break;
    }

    if (batch.length < perPage) break;
    page += 1;
  }

  return { runs, workflows };
}

function matchesWorkflowFilter(
  run: GitHubWorkflowRun,
  workflows: Map<number, string>,
  filter: string,
): boolean {
  const workflowName = run.name ?? (run.workflow_id ? workflows.get(run.workflow_id) : undefined) ?? '';
  return (
    workflowName === filter ||
    run.path === filter ||
    String(run.workflow_id ?? '') === filter ||
    String(run.id) === filter
  );
}

async function loadWorkflowNameMap(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const response = await octokit.rest.actions.listRepoWorkflows({ owner, repo, per_page: 100 });
    for (const workflow of response.data.workflows) {
      map.set(workflow.id, workflow.name);
    }
  } catch {
    // Workflows listing is optional for filtering.
  }
  return map;
}

export function resolveWorkflowName(
  run: GitHubWorkflowRun,
  workflows: Map<number, string>,
): string {
  if (run.name) return run.name;
  if (run.workflow_id && workflows.has(run.workflow_id)) {
    return workflows.get(run.workflow_id)!;
  }
  return run.path ?? 'Workflow';
}

export async function listWorkflowRunArtifacts(
  token: string,
  repository: string,
  runId: number,
): Promise<Array<{ id: number; name: string; size_in_bytes: number }>> {
  const [owner, repo] = repository.split('/');
  const octokit = github.getOctokit(token);
  const artifacts: Array<{ id: number; name: string; size_in_bytes: number }> = [];
  let page = 1;

  while (true) {
    const response = await octokit.rest.actions.listWorkflowRunArtifacts({
      owner,
      repo,
      run_id: runId,
      per_page: 100,
      page,
    });
    for (const artifact of response.data.artifacts) {
      if (artifact.expired) continue;
      artifacts.push({
        id: artifact.id,
        name: artifact.name,
        size_in_bytes: artifact.size_in_bytes,
      });
    }
    if (response.data.artifacts.length < 100) break;
    page += 1;
  }

  return artifacts;
}
