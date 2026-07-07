import * as core from '@actions/core';
import * as github from '@actions/github';
import type { RunContext } from '../model/test-run';

export async function resolveCurrentJobUrl(
  token: string,
  context: RunContext,
): Promise<string | undefined> {
  const { owner, repo } = github.context.repo;
  const octokit = github.getOctokit(token);
  const desired = (process.env.GITHUB_JOB ?? '').trim();

  try {
    const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: context.runId,
      per_page: 100,
    });

    const jobs = data.jobs ?? [];
    if (jobs.length === 0) return undefined;

    const match = desired
      ? jobs.find((j) => j.name === desired)
      : undefined;
    const selected = match ?? jobs[0];
    if (!selected?.id) return undefined;

    return `${context.repositoryUrl}/actions/runs/${context.runId}/job/${selected.id}`;
  } catch (error) {
    core.debug(`Failed to resolve job URL: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

