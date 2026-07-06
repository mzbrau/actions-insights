import * as core from '@actions/core';
import * as github from '@actions/github';
import type { ActionConfig } from '../config';
import type { TestRun } from '../model/test-run';
import { buildReportingContext } from '../reporting/context';
import { buildReportLinks } from '../reporting/links';
import { COMMENT_MARKER, renderPrComment } from '../reporting/pr-comment';

export async function upsertPrComment(
  token: string,
  run: TestRun,
  config: ActionConfig,
): Promise<void> {
  const prNumber = run.context.prNumber;
  if (!prNumber || config.commentMode === 'off') return;

  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const ctx = buildReportingContext(run, config);
  const links = buildReportLinks(run.context);
  const body = renderPrComment(ctx, config, links);

  try {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    });

    const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));
    if (existing) {
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existing.id,
        body,
      });
      core.info('Updated PR comment');
    } else {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      });
      core.info('Created PR comment');
    }
  } catch (error) {
    core.warning(`Failed to update PR comment: ${error instanceof Error ? error.message : String(error)}`);
  }
}
