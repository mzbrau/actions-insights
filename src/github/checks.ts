import * as core from '@actions/core';
import * as github from '@actions/github';
import type { ActionConfig } from '../config';
import type { TestRun } from '../model/test-run';
import { buildCheckAnnotations } from '../reporting/checks';
import { buildReportingContext } from '../reporting/context';
import { renderJobSummary } from '../reporting/job-summary';
import { buildReportLinks } from '../reporting/links';

const MAX_ANNOTATIONS = 50;

export async function publishCheckRun(
  token: string,
  run: TestRun,
  config: ActionConfig,
): Promise<void> {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const ctx = buildReportingContext(run, config);
  const links = buildReportLinks(run.context);
  const summary = renderJobSummary(ctx, {
    ...config,
    maxFailedTestsInSummary: Math.min(config.maxFailedTestsInSummary, 10),
    includeSlowestTests: Math.min(config.includeSlowestTests, 5),
  }, links);

  const annotations = buildCheckAnnotations(
    ctx.failedTests,
    MAX_ANNOTATIONS,
    config.maxStackTraceLines,
  );

  try {
    await octokit.rest.checks.create({
      owner,
      repo,
      name: config.checkName,
      head_sha: run.context.commitSha,
      status: 'completed',
      conclusion: run.status === 'passed' ? 'success' : 'failure',
      details_url: links.workflowRun,
      output: {
        title: `${run.stats.passed.toLocaleString()} passed, ${run.stats.failed.toLocaleString()} failed`,
        summary,
        annotations,
      },
    });
    core.info(`Published check run: ${config.checkName}`);
  } catch (error) {
    core.warning(`Failed to publish check run: ${error instanceof Error ? error.message : String(error)}`);
  }
}
