import * as github from '@actions/github';
import type { TestRun } from '../model/test-run';
import { formatDuration } from '../model/test-run';

export const COMMENT_MARKER = '<!-- actions-insights-report -->';

export async function upsertPrComment(
  token: string,
  run: TestRun,
  reportUrl: string | undefined,
): Promise<void> {
  const prNumber = run.context.prNumber;
  if (!prNumber) return;

  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const { stats, status } = run;
  const emoji = status === 'passed' ? '✅' : '❌';
  const link = reportUrl ? `[View Full Report →](${reportUrl})` : '_Report URL unavailable_';

  const body = `${COMMENT_MARKER}
## ${emoji} Test Report

| | |
|---|---|
| **Passed** | ${stats.passed.toLocaleString()} |
| **Failed** | ${stats.failed.toLocaleString()} |
| **Skipped** | ${stats.skipped.toLocaleString()} |
| **Duration** | ${formatDuration(stats.durationMs)} |

${link}
`;

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
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
  }
}
