import { describe, expect, it } from 'vitest';
import { buildHistoryUpdate } from '../../src/history-repo/publisher/build-update';
import type { PublishTestRun } from '../../src/history-repo/publisher/paths';
import { msbuildParser } from '../../src/diagnostic-parsers/msbuild';
import * as fs from 'fs';
import * as path from 'path';

const fixture = fs.readFileSync(
  path.join(__dirname, '../fixtures/diagnostics/msbuild-warnings.log'),
  'utf8',
);

function sampleRun(): PublishTestRun {
  const diagnostics = msbuildParser.parse(fixture, 'build.log');
  const now = new Date().toISOString();
  return {
    id: '100',
    status: 'passed',
    stats: {
      total: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      inconclusive: 0,
      durationMs: 100,
      successRate: 100,
    },
    tests: [{
      name: 'Test',
      fullName: 'MyClass.Test',
      outcome: 'passed',
      durationMs: 100,
    }],
    context: {
      repository: 'owner/repo',
      repositoryUrl: 'https://github.com/owner/repo',
      workflow: 'CI',
      workflowUrl: 'https://github.com/owner/repo/actions/runs/1',
      runId: 100,
      branch: 'main',
      ref: 'refs/heads/main',
      commitSha: 'abc123',
      commitShortSha: 'abc123',
      commitMessage: 'test',
      commitUrl: 'https://github.com/owner/repo/commit/abc123',
      author: 'dev',
      actor: 'dev',
      startedAt: now,
      completedAt: now,
    },
    diagnostics,
    workflowTiming: {
      summary: {
        workflowDurationMs: 120000,
        jobs: [{ name: 'build', durationMs: 120000 }],
        steps: [{
          jobName: 'build',
          stepName: 'dotnet build',
          stepNumber: 1,
          status: 'success',
          durationMs: 60000,
        }],
        slowestStep: 'build › dotnet build',
      },
      runner: { os: 'Linux', labels: ['ubuntu-latest'] },
    },
  };
}

describe('diagnostics and timing history publish', () => {
  it('emits diagnostics and timing sidecars with RunSummary fields', () => {
    const update = buildHistoryUpdate(sampleRun(), {
      dataPath: 'data',
      repositoryName: 'owner/repo',
      historyLimit: 20,
      retainDays: 30,
      existing: {},
    });

    const history = update.files.find((f) => f.path.endsWith('history.json'))!.content as {
      runs: Array<{
        diagnostics?: { errors: number };
        diagnosticsFile?: string;
        timing?: { workflowDurationMs?: number };
        timingFile?: string;
      }>;
    };
    expect(history.runs[0].diagnostics?.errors).toBe(1);
    expect(history.runs[0].diagnosticsFile).toContain('.diagnostics.json');
    expect(history.runs[0].timing?.workflowDurationMs).toBe(120000);
    expect(history.runs[0].timingFile).toContain('.timing.json');

    expect(update.files.some((f) => f.path.endsWith('.diagnostics.json'))).toBe(true);
    expect(update.files.some((f) => f.path.endsWith('.timing.json'))).toBe(true);
    expect(update.commitPaths.some((p) => p.endsWith('.diagnostics.json'))).toBe(true);
    expect(update.commitPaths.some((p) => p.endsWith('.timing.json'))).toBe(true);
  });
});
