import { describe, expect, it } from 'vitest';
import { buildHistoryUpdate } from '../../src/history-repo/publisher/build-update';
import type { PublishTestRun } from '../../src/history-repo/publisher/paths';
import { coberturaParser } from '../../src/coverage-parsers/cobertura';
import * as fs from 'fs';
import * as path from 'path';

const fixture = fs.readFileSync(
  path.join(__dirname, '../fixtures/coverage/cobertura.xml'),
  'utf8',
);

function sampleRun(): PublishTestRun {
  const coverage = coberturaParser.parse(fixture, 'coverage.cobertura.xml');
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
    coverage,
  };
}

describe('coverage history publish', () => {
  it('emits coverage sidecar and RunSummary coverage fields', () => {
    const update = buildHistoryUpdate(sampleRun(), {
      dataPath: 'data',
      repositoryName: 'owner/repo',
      historyLimit: 20,
      retainDays: 30,
      existing: {},
    });

    const runSummaryFile = update.files.find((f) => f.path.endsWith('history.json'));
    expect(runSummaryFile).toBeDefined();
    const history = runSummaryFile!.content as { runs: Array<{ coverage?: { line?: number }; coverageFile?: string }> };
    expect(history.runs[0].coverage?.line).toBe(75);
    expect(history.runs[0].coverageFile).toContain('.coverage.json');

    const sidecar = update.files.find((f) => f.path.endsWith('.coverage.json'));
    expect(sidecar).toBeDefined();
    expect((sidecar!.content as { summary: { line?: number } }).summary.line).toBe(75);
    expect(update.commitPaths.some((p) => p.endsWith('.coverage.json'))).toBe(true);
  });
});
