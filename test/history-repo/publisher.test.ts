import { describe, expect, it } from 'vitest';
import {
  buildHistoryUpdate,
  createEmptyRepositoriesIndex,
  formatRunFileName,
  pruneBranchHistory,
  resolveBranchKey,
  resolveRepositoryKey,
} from '../../src/history-repo/publisher';
import type { BranchHistory } from '../../src/history-repo/models';
import { sampleRun } from '../reporting/fixtures';

describe('history-publisher', () => {
  it('resolves repository key from name', () => {
    expect(resolveRepositoryKey('owner/repo')).toBe('owner.repo');
  });

  it('resolves PR branch key', () => {
    const key = resolveBranchKey(sampleRun.context);
    expect(key.branchKey).toBe('pr-42');
    expect(key.branchType).toBe('pr');
  });

  it('formats run file names with run id', () => {
    const name = formatRunFileName('2026-07-07T10:14:32.000Z', '99');
    expect(name).toContain('2026-07-07');
    expect(name).toContain('-99.json');
  });

  it('builds history update files for a new run', () => {
    const update = buildHistoryUpdate(sampleRun, {
      dataPath: 'data',
      repositoryName: 'owner/repo',
      historyLimit: 20,
      retainDays: 30,
      existing: {
        repositoriesIndex: createEmptyRepositoriesIndex(),
      },
    });

    expect(update.repositoryKey).toBe('owner.repo');
    expect(update.branchKey).toBe('pr-42');
    expect(update.files.length).toBeGreaterThanOrEqual(6);

    const runFile = update.files.find((f) => f.path.endsWith('.json') && f.path.includes('/runs/'));
    expect(runFile).toBeDefined();
    const record = runFile!.content as { failures: unknown[]; tests: unknown[] };
    expect(record.failures).toHaveLength(1);
    expect(record.tests).toHaveLength(3);
  });

  it('updates repositories index with repo entry', () => {
    const update = buildHistoryUpdate(sampleRun, {
      dataPath: 'data',
      repositoryName: 'owner/repo',
      historyLimit: 20,
      retainDays: 30,
      existing: {},
    });

    const indexFile = update.files.find((f) => f.path.endsWith('repositories.json'));
    const index = indexFile!.content as { repositories: { key: string }[] };
    expect(index.repositories).toHaveLength(1);
    expect(index.repositories[0].key).toBe('owner.repo');
  });

  it('prunes branch history by limit and age', () => {
    const now = Date.now();
    const history: BranchHistory = {
      version: 1,
      branchKey: 'main',
      branchLabel: 'main',
      updatedAt: new Date().toISOString(),
      runs: Array.from({ length: 25 }, (_, i) => ({
        runId: String(i),
        workflowRunId: i,
        status: 'passed' as const,
        date: new Date(now - i * 3600_000).toISOString(),
        durationMs: 100,
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        commitSha: 'abc',
        commitShortSha: 'abc',
        commitMessage: 'msg',
        author: 'dev',
        runFile: `run-${i}.json`,
      })),
    };

    const pruned = pruneBranchHistory(history, { historyLimit: 10, retainDays: 30 });
    expect(pruned.runs.length).toBeLessThanOrEqual(10);
  });

  it('is idempotent for same run id', () => {
    const recentRun = {
      ...sampleRun,
      context: {
        ...sampleRun.context,
        completedAt: new Date().toISOString(),
      },
    };

    const first = buildHistoryUpdate(recentRun, {
      dataPath: 'data',
      repositoryName: 'owner/repo',
      historyLimit: 20,
      retainDays: 30,
      existing: {},
    });

    const branchHistory = first.files.find((f) => f.path.endsWith('history.json'))!.content as BranchHistory;
    const branchesIndex = first.files.find((f) => f.path.endsWith('branches.json'))!.content;
    const metadata = first.files.find((f) => f.path.includes('metadata.json'))!.content;

    const second = buildHistoryUpdate(recentRun, {
      dataPath: 'data',
      repositoryName: 'owner/repo',
      historyLimit: 20,
      retainDays: 30,
      existing: {
        branchHistory,
        branchesIndex: branchesIndex as never,
        metadata: metadata as never,
      },
    });

    const history2 = second.files.find((f) => f.path.endsWith('history.json'))!.content as BranchHistory;
    expect(history2.runs.filter((r) => r.runId === recentRun.id)).toHaveLength(1);
  });
});
