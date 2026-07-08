import * as core from '@actions/core';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildHistoryUpdate,
  resolveBranchKey,
} from './publisher';
import type { ActionConfig } from '../config';
import type { TestRun } from '../model/test-run';
import { readExistingState } from './import/existing-state';
import { writeJsonFile } from '../publisher/site-merger';

const MAX_PUSH_RETRIES = 3;

export async function publishToHistoryRepository(
  run: TestRun,
  config: ActionConfig,
): Promise<void> {
  const history = config.history;
  if (!history.enabled) return;

  if (!history.repository) {
    core.warning('history-enabled is true but history-repository is not set. Skipping history publish.');
    return;
  }
  if (!history.token) {
    core.warning('history-enabled is true but history-token is not set. Skipping history publish.');
    return;
  }
  if (!history.repositoryName) {
    core.warning('Could not resolve source repository name for history publish. Skipping.');
    return;
  }

  const workDir = path.join(os.tmpdir(), `actions-insights-history-${Date.now()}`);
  const repoUrl = `https://x-access-token:${history.token}@github.com/${history.repository}.git`;

  try {
    core.info(`Publishing history to ${history.repository} (branch: ${history.branch})`);
    cloneRepository(repoUrl, history.branch, workDir);
    configureGitIdentity(workDir);

    for (let attempt = 1; attempt <= MAX_PUSH_RETRIES; attempt++) {
      const { branchKey } = resolveBranchKey(run.context);
      const existing = readExistingState(
        workDir,
        history.dataPath,
        history.repositoryName,
        run.context,
        branchKey,
      );
      const update = buildHistoryUpdate(run, {
        dataPath: history.dataPath,
        repositoryName: history.repositoryName,
        defaultRepository: history.defaultRepository,
        historyLimit: config.historyLimit,
        retainDays: config.retainDays,
        existing,
      });

      for (const file of update.files) {
        const absolute = path.join(workDir, file.path);
        writeJsonFile(absolute, file.content);
      }

      const relativePaths = update.commitPaths.map((p) =>
        path.relative(workDir, path.isAbsolute(p) ? p : path.join(workDir, p)),
      );

      if (!hasChanges(workDir, relativePaths)) {
        core.info('History repository already up to date for this run.');
        return;
      }

      const message = `actions-insights: ${history.repositoryName}@${run.context.commitShortSha} [${run.status}]`;
      commitFiles(workDir, relativePaths, message);

      try {
        pullRebase(workDir, history.branch, repoUrl);
        push(workDir, history.branch, repoUrl);
        core.info(`Published history run ${update.runId} to ${history.repository}`);
        return;
      } catch (error) {
        if (attempt === MAX_PUSH_RETRIES) throw error;
        core.warning(
          `History push conflict (attempt ${attempt}/${MAX_PUSH_RETRIES}), retrying: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        resetToRemote(workDir, history.branch, repoUrl);
      }
    }
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

function cloneRepository(repoUrl: string, branch: string, workDir: string): void {
  git(['clone', '--depth', '1', '--branch', branch, repoUrl, workDir], process.cwd());
}

function configureGitIdentity(workDir: string): void {
  git(['config', 'user.email', 'actions-insights@users.noreply.github.com'], workDir);
  git(['config', 'user.name', 'Actions Insights'], workDir);
}

function hasChanges(workDir: string, relativePaths: string[]): boolean {
  const status = git(['status', '--porcelain', ...relativePaths], workDir);
  return status.trim().length > 0;
}

function commitFiles(workDir: string, relativePaths: string[], message: string): void {
  git(['add', ...relativePaths], workDir);
  git(['commit', '-m', message], workDir);
}

function pullRebase(workDir: string, branch: string, repoUrl: string): void {
  git(['pull', '--rebase', repoUrl, branch], workDir);
}

function push(workDir: string, branch: string, repoUrl: string): void {
  git(['push', repoUrl, `HEAD:${branch}`], workDir);
}

function resetToRemote(workDir: string, branch: string, repoUrl: string): void {
  git(['fetch', repoUrl, branch], workDir);
  git(['reset', '--hard', `FETCH_HEAD`], workDir);
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}
