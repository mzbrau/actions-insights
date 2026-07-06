import * as github from '@actions/github';
import type { RunContext } from '../model/test-run';

export function detectContext(): RunContext {
  const ctx = github.context;
  const { owner, repo } = ctx.repo;
  const repository = `${owner}/${repo}`;
  const repositoryUrl = `https://github.com/${repository}`;
  const runId = ctx.runId;
  const runAttempt = ctx.runAttempt;
  const workflow = process.env.GITHUB_WORKFLOW ?? 'Workflow';
  const workflowUrl = `${repositoryUrl}/actions/runs/${runId}`;
  const ref = ctx.ref;
  const branch = extractBranch(ref, ctx);
  const tag = ref.startsWith('refs/tags/') ? ref.replace('refs/tags/', '') : undefined;
  const prNumber = ctx.payload.pull_request?.number as number | undefined;
  const prUrl = prNumber ? `${repositoryUrl}/pull/${prNumber}` : undefined;
  const commitSha = ctx.sha;
  const commitShortSha = commitSha.slice(0, 7);
  const commitUrl = `${repositoryUrl}/commit/${commitSha}`;
  const commitMessage = getCommitMessage();
  const author = getCommitAuthor();
  const actor = ctx.actor;
  const startedAt = new Date().toISOString();
  const completedAt = startedAt;

  return {
    repository,
    repositoryUrl,
    workflow,
    workflowUrl,
    runId,
    runAttempt,
    branch,
    ref,
    tag,
    prNumber,
    prUrl,
    commitSha,
    commitShortSha,
    commitMessage,
    commitUrl,
    author,
    actor,
    startedAt,
    completedAt,
  };
}

function extractBranch(ref: string, ctx: typeof github.context): string {
  if (ctx.payload.pull_request?.head?.ref) {
    return ctx.payload.pull_request.head.ref as string;
  }
  if (ref.startsWith('refs/heads/')) {
    return ref.replace('refs/heads/', '');
  }
  if (ref.startsWith('refs/tags/')) {
    return ref.replace('refs/tags/', '');
  }
  return ref;
}

function getCommitMessage(): string {
  const message = process.env.GITHUB_EVENT_PATH
    ? tryReadEventHeadCommit()?.message
    : undefined;
  return (message ?? 'Workflow run').split('\n')[0].trim();
}

function getCommitAuthor(): string {
  const author = tryReadEventHeadCommit()?.author?.name
    ?? tryReadEventHeadCommit()?.author?.username
    ?? github.context.actor;
  return author ?? 'unknown';
}

function tryReadEventHeadCommit(): { message?: string; author?: { name?: string; username?: string } } | undefined {
  try {
    const fs = require('fs');
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath || !fs.existsSync(eventPath)) return undefined;
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    return event.head_commit ?? event.pull_request?.head?.commit;
  } catch {
    return undefined;
  }
}

