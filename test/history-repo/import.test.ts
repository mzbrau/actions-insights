import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { mergeUpdateIntoExisting, writeHistoryUpdate } from '../../src/history-repo/import/apply-update';
import { isRunImported, readBaselineImportState } from '../../src/history-repo/import/existing-state';
import { workflowRunToContext, type GitHubWorkflowRun } from '../../src/history-repo/import/workflow-context';
import { buildHistoryUpdate, createEmptyRepositoriesIndex } from '../../src/history-repo/publisher';
import { sampleRun } from '../reporting/fixtures';

describe('history import', () => {
  it('maps branch workflow runs to publish context', () => {
    const run: GitHubWorkflowRun = {
      id: 99,
      name: 'CI',
      head_branch: 'main',
      head_sha: 'abc123def4567890abcdef1234567890abcdef12',
      event: 'push',
      status: 'completed',
      conclusion: 'success',
      created_at: '2026-07-01T10:00:00Z',
      updated_at: '2026-07-01T10:05:00Z',
      head_commit: {
        message: 'Fix tests\n\nDetails',
        author: { name: 'Ada Lovelace' },
      },
    };

    const context = workflowRunToContext('owner/repo', run);
    expect(context.runId).toBe(99);
    expect(context.branch).toBe('main');
    expect(context.ref).toBe('refs/heads/main');
    expect(context.commitShortSha).toBe('abc123d');
    expect(context.commitMessage).toBe('Fix tests');
    expect(context.author).toBe('Ada Lovelace');
    expect(context.workflow).toBe('CI');
  });

  it('maps pull request workflow runs to publish context', () => {
    const run: GitHubWorkflowRun = {
      id: 100,
      name: 'CI',
      head_branch: 'feature/tests',
      head_sha: 'abc123def4567890abcdef1234567890abcdef12',
      event: 'pull_request',
      status: 'completed',
      conclusion: 'failure',
      created_at: '2026-07-01T10:00:00Z',
      updated_at: '2026-07-01T10:05:00Z',
      pull_requests: [{ number: 42, base: { ref: 'main' }, head: { ref: 'feature/tests' } }],
    };

    const context = workflowRunToContext('owner/repo', run);
    expect(context.prNumber).toBe(42);
    expect(context.baseBranch).toBe('main');
    expect(context.prUrl).toBe('https://github.com/owner/repo/pull/42');
  });

  it('detects imported workflow run ids from history files', () => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'history-import-'));
    const repoDir = path.join(workDir, 'data', 'repositories', 'owner.repo', 'branches', 'main');
    fs.mkdirSync(path.join(repoDir, 'runs'), { recursive: true });

    fs.writeFileSync(
      path.join(repoDir, 'history.json'),
      JSON.stringify({
        version: 1,
        branchKey: 'main',
        branchLabel: 'main',
        updatedAt: '2026-07-01T10:00:00Z',
        runs: [{ runId: '42', workflowRunId: 42, status: 'passed', date: '2026-07-01T10:00:00Z', durationMs: 1, total: 1, passed: 1, failed: 0, skipped: 0, commitSha: 'abc', commitShortSha: 'abc', commitMessage: 'm', author: 'a', runFile: 'run.json' }],
      }),
    );

    expect(isRunImported(workDir, 'data', 'owner/repo', 42)).toBe(true);
    expect(isRunImported(workDir, 'data', 'owner/repo', 43)).toBe(false);

    fs.rmSync(workDir, { recursive: true, force: true });
  });

  it('merges sequential history updates for import', () => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'history-import-'));
  try {
      const baseline = readBaselineImportState(workDir, 'data', 'owner/repo');
      let existing = { ...baseline, repositoriesIndex: createEmptyRepositoriesIndex() };

      const firstRun = {
        ...sampleRun,
        id: '10',
        context: {
          ...sampleRun.context,
          runId: 10,
          completedAt: '2026-07-01T10:00:00Z',
        },
      };
      const first = buildHistoryUpdate(firstRun, {
        dataPath: 'data',
        repositoryName: 'owner/repo',
        historyLimit: 20,
        retainDays: 30,
        existing,
      });
      writeHistoryUpdate(workDir, first);
      existing = mergeUpdateIntoExisting(existing, first);

      const secondRun = {
        ...sampleRun,
        id: '11',
        context: {
          ...sampleRun.context,
          runId: 11,
          completedAt: '2026-07-02T10:00:00Z',
        },
      };
      const second = buildHistoryUpdate(secondRun, {
        dataPath: 'data',
        repositoryName: 'owner/repo',
        historyLimit: 20,
        retainDays: 30,
        existing,
      });
      writeHistoryUpdate(workDir, second);

      const historyFile = second.files.find((f) => f.path.endsWith('history.json'))!
        .content as { runs: Array<{ runId: string }> };
      expect(historyFile.runs.map((r) => r.runId)).toEqual(['11', '10']);
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  });
});
