import * as core from '@actions/core';
import type { ActionConfig } from '../config';
import type { TestRun } from '../model/test-run';
import { buildReportingContext } from '../reporting/context';
import { renderJobSummary } from '../reporting/job-summary';
import { buildReportLinks } from '../reporting/links';

export async function writeJobSummary(run: TestRun, config: ActionConfig): Promise<void> {
  if (!config.generateJobSummary || !process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  const ctx = buildReportingContext(run, config);
  const links = buildReportLinks(run.context);
  const summary = renderJobSummary(ctx, config, links);
  await core.summary.addRaw(summary).write();
}
