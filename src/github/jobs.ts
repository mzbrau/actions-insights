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

type WorkflowJob = {
  id?: number;
  name?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  runner_os?: string | null;
  labels?: string[] | null;
  steps?: Array<{
    name?: string | null;
    number?: number;
    started_at?: string | null;
    completed_at?: string | null;
    status?: string | null;
    conclusion?: string | null;
  }> | null;
};

export interface FailedPriorStep {
  stepName: string;
}

export interface WorkflowRunJobs {
  jobs: WorkflowJob[];
  workflowRun?: {
    status?: string | null;
    created_at?: string | null;
    run_started_at?: string | null;
    updated_at?: string | null;
  };
}

/** Best-effort match for the current job; no fallback when unmatched. */
function findMatchingJob(jobs: WorkflowJob[]): WorkflowJob | undefined {
  const desired = (process.env.GITHUB_JOB ?? '').trim();
  if (!desired) return undefined;

  const exact = jobs.find((job) => job.name === desired);
  if (exact) return exact;

  // Matrix jobs are often named "job-id (matrix-value)" while GITHUB_JOB is just the job id.
  const matrixPrefix = `${desired} (`;
  return jobs.find((job) => typeof job.name === 'string' && job.name.startsWith(matrixPrefix));
}

function selectCurrentJob(jobs: WorkflowJob[]): WorkflowJob | undefined {
  return findMatchingJob(jobs) ?? jobs[0];
}

export function extractFailedPriorSteps(job: WorkflowJob | undefined): FailedPriorStep[] {
  const steps = job?.steps ?? [];
  const failed: FailedPriorStep[] = [];

  for (const step of steps) {
    if (step.conclusion !== 'failure') continue;
    if (step.status === 'in_progress' || step.status === 'pending') continue;
    failed.push({
      stepName: step.name ?? `Step ${step.number ?? '?'}`,
    });
  }

  return failed;
}

export async function fetchWorkflowRunJobs(
  token: string,
  context: RunContext,
  options: { includeWorkflowRun?: boolean } = {},
): Promise<WorkflowRunJobs | undefined> {
  const { owner, repo } = github.context.repo;
  const octokit = github.getOctokit(token);

  try {
    const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: context.runId,
      per_page: 100,
    });

    const jobs = (data.jobs ?? []) as WorkflowJob[];
    if (jobs.length === 0) return undefined;

    if (!options.includeWorkflowRun) {
      return { jobs };
    }

    const { data: workflowRun } = await octokit.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: context.runId,
    });

    return { jobs, workflowRun };
  } catch (error) {
    core.debug(`Failed to fetch workflow jobs: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

export function resolveCurrentJobUrlFromJobs(
  context: RunContext,
  jobs: WorkflowJob[] | undefined,
): string | undefined {
  if (!jobs || jobs.length === 0) return undefined;
  const selected = selectCurrentJob(jobs);
  if (!selected?.id) return undefined;
  return `${context.repositoryUrl}/actions/runs/${context.runId}/job/${selected.id}`;
}

export async function resolveCurrentJobUrl(
  token: string,
  context: RunContext,
  prefetched?: WorkflowRunJobs,
): Promise<string | undefined> {
  const jobs = prefetched?.jobs ?? (await fetchWorkflowRunJobs(token, context))?.jobs;
  return resolveCurrentJobUrlFromJobs(context, jobs);
}

export function fetchFailedPriorStepsFromJobs(
  prefetched: WorkflowRunJobs | undefined,
): FailedPriorStep[] {
  if (!prefetched) return [];
  const job = findMatchingJob(prefetched.jobs);
  if (!job) return [];
  return extractFailedPriorSteps(job);
}

export function buildWorkflowTimingFromJobs(
  prefetched: WorkflowRunJobs,
): WorkflowTimingReport | undefined {
  const { jobs, workflowRun } = prefetched;
  if (jobs.length === 0) return undefined;

  const jobTimings: WorkflowJobTiming[] = [];
  const steps: WorkflowStepTiming[] = [];
  const matchedJob = selectCurrentJob(jobs);
  const runner: WorkflowRunnerInfo | undefined = matchedJob
    ? {
        os: matchedJob.runner_os ?? undefined,
        labels: matchedJob.labels ?? undefined,
      }
    : undefined;

  for (const job of jobs) {
    const jobDuration = durationBetweenMs(job.started_at, job.completed_at);
    jobTimings.push({
      name: job.name ?? 'Job',
      durationMs: jobDuration,
      startedAt: job.started_at ?? undefined,
      completedAt: job.completed_at ?? undefined,
    });

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

  const runStartedAt = workflowRun?.run_started_at ?? workflowRun?.created_at;
  const runCompletedAt = workflowRun?.status === 'completed' ? workflowRun.updated_at : undefined;
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
}

export async function fetchWorkflowTiming(
  token: string,
  context: RunContext,
  prefetched?: WorkflowRunJobs,
): Promise<WorkflowTimingReport | undefined> {
  try {
    let data = prefetched;
    if (!data?.workflowRun) {
      data = await fetchWorkflowRunJobs(token, context, { includeWorkflowRun: true });
    }
    if (!data) return undefined;
    return buildWorkflowTimingFromJobs(data);
  } catch (error) {
    core.debug(`Failed to fetch workflow timing: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}
