import * as core from '@actions/core';
import * as github from '@actions/github';
import type { WorkflowTimingReport } from '../model/timing';
import {
  durationBetweenMs,
  findSlowestStep,
  type WorkflowJobTiming,
  type WorkflowRunnerInfo,
  type WorkflowStepTiming,
} from '@actions-insights/history-models';
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

export async function fetchWorkflowTiming(
  token: string,
  context: RunContext,
): Promise<WorkflowTimingReport | undefined> {
  const { owner, repo } = github.context.repo;
  const octokit = github.getOctokit(token);
  const desiredJob = (process.env.GITHUB_JOB ?? '').trim();

  try {
    const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: context.runId,
      per_page: 100,
    });

    const jobs = data.jobs ?? [];
    if (jobs.length === 0) return undefined;

    const { data: workflowRun } = await octokit.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: context.runId,
    });

    const jobTimings: WorkflowJobTiming[] = [];
    const steps: WorkflowStepTiming[] = [];
    let runner: WorkflowRunnerInfo | undefined;

    for (const job of jobs) {
      const jobDuration = durationBetweenMs(job.started_at, job.completed_at);
      jobTimings.push({
        name: job.name ?? 'Job',
        durationMs: jobDuration,
        startedAt: job.started_at ?? undefined,
        completedAt: job.completed_at ?? undefined,
      });

      if (desiredJob && job.name === desiredJob) {
        const jobMeta = job as { runner_os?: string | null; labels?: string[] | null };
        runner = {
          os: jobMeta.runner_os ?? undefined,
          labels: jobMeta.labels ?? undefined,
        };
      }

      for (const step of job.steps ?? []) {
        steps.push({
          jobName: job.name ?? 'Job',
          stepName: step.name ?? `Step ${step.number}`,
          stepNumber: step.number ?? 0,
          status: step.conclusion ?? step.status ?? 'unknown',
          durationMs: durationBetweenMs(step.started_at, step.completed_at),
          startedAt: step.started_at ?? undefined,
          completedAt: step.completed_at ?? undefined,
        });
      }
    }

    if (!runner && jobs.length > 0) {
      const first = jobs[0];
      const jobMeta = first as { runner_os?: string | null; labels?: string[] | null };
      runner = {
        os: jobMeta.runner_os ?? undefined,
        labels: jobMeta.labels ?? undefined,
      };
    }

    const runStartedAt = workflowRun.run_started_at ?? workflowRun.created_at;
    const runCompletedAt = workflowRun.status === 'completed' ? workflowRun.updated_at : undefined;
    const workflowDurationMs = durationBetweenMs(runStartedAt, runCompletedAt) || undefined;

    const slowestStep = findSlowestStep(steps);

    return {
      summary: {
        workflowDurationMs,
        jobs: jobTimings,
        steps,
        slowestStep,
      },
      runner,
    };
  } catch (error) {
    core.debug(`Failed to fetch workflow timing: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}
