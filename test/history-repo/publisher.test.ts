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
    expect(update.files.length).toBeGreaterThanOrEqual(7);

    const runFile = update.files.find((f) => f.path.endsWith('.json') && f.path.includes('/runs/'));
    expect(runFile).toBeDefined();
    const record = runFile!.content as { failures: unknown[]; tests: unknown[] };
    expect(record.failures).toHaveLength(1);
    expect(record.tests).toHaveLength(3);

    const testsFile = update.files.find((f) => f.path.endsWith('tests.json'));
    expect(testsFile).toBeDefined();
    const tests = testsFile!.content as { tests: Record<string, { runCount: number }> };
    expect(tests.tests['SampleTests.ShouldFail']).toBeDefined();
    expect(tests.tests['SampleTests.ShouldFail'].runCount).toBe(1);
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

  it('appends test history points across publishes', () => {
    const recentDate = new Date().toISOString();
    const firstRun = {
      ...sampleRun,
      context: { ...sampleRun.context, completedAt: recentDate },
    };

    const first = buildHistoryUpdate(firstRun, {
      dataPath: 'data',
      repositoryName: 'owner/repo',
      historyLimit: 20,
      retainDays: 30,
      existing: {},
    });

    const repositoryTests = first.files.find((f) => f.path.endsWith('tests.json'))!.content;
    const branchHistory = first.files.find((f) => f.path.endsWith('history.json'))!.content as BranchHistory;

    const secondRun = {
      ...firstRun,
      id: '2',
      context: { ...firstRun.context, runId: 2, completedAt: new Date().toISOString() },
    };

    const second = buildHistoryUpdate(secondRun, {
      dataPath: 'data',
      repositoryName: 'owner/repo',
      historyLimit: 20,
      retainDays: 30,
      existing: { repositoryTests: repositoryTests as never, branchHistory },
    });

    const tests2 = second.files.find((f) => f.path.endsWith('tests.json'))!.content as {
      tests: Record<string, { runCount: number; points: { runId: string }[] }>;
    };
    const entry = tests2.tests['SampleTests.ShouldFail'];
    expect(entry.runCount).toBe(2);
    expect(entry.points.map((p) => p.runId)).toContain('2');
  });
});
