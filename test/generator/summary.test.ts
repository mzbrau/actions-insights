import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { renderSummaryPage } from '../../src/generator/pages/summary';
import type { TestRun } from '../../src/model/test-run';

const sampleRun: TestRun = {
  id: '1',
  title: 'Actions Insights',
  status: 'failed',
  stats: {
    total: 3,
    passed: 1,
    failed: 1,
    skipped: 1,
    inconclusive: 0,
    durationMs: 1634,
    successRate: 33.3,
  },
  tests: [
    {
      id: 'pass',
      name: 'ShouldPass',
      fullName: 'SampleTests.ShouldPass',
      outcome: 'passed',
      durationMs: 123,
      assembly: 'SampleTests.dll',
      namespace: 'SampleTests',
      className: 'SampleTests',
      method: 'ShouldPass',
      attachments: [],
      traits: [],
      categories: [],
      retries: 0,
      sourceFile: 'sample.trx',
    },
    {
      id: 'fail',
      name: 'ShouldFail',
      fullName: 'SampleTests.ShouldFail',
      outcome: 'failed',
      durationMs: 1500,
      assembly: 'SampleTests.dll',
      namespace: 'SampleTests',
      className: 'SampleTests',
      method: 'ShouldFail',
      message: 'Expected true but was false',
      stackTrace: 'at SampleTests.ShouldFail() line 42',
      attachments: [],
      traits: [],
      categories: [],
      retries: 0,
      sourceFile: 'sample.trx',
    },
    {
      id: 'skip',
      name: 'ShouldSkip',
      fullName: 'SampleTests.ShouldSkip',
      outcome: 'skipped',
      durationMs: 10,
      attachments: [],
      traits: [],
      categories: [],
      retries: 0,
      sourceFile: 'sample.trx',
    },
  ],
  context: {
    repository: 'owner/repo',
    repositoryUrl: 'https://github.com/owner/repo',
    workflow: 'CI',
    workflowUrl: 'https://github.com/owner/repo/actions/runs/1',
    runId: 1,
    runAttempt: 1,
    branch: 'main',
    ref: 'refs/heads/main',
    commitSha: 'abc123def456',
    commitShortSha: 'abc123d',
    commitMessage: 'Fix tests',
    commitUrl: 'https://github.com/owner/repo/commit/abc123def456',
    author: 'octocat',
    actor: 'octocat',
    startedAt: '2026-01-01T12:00:00.000Z',
    completedAt: '2026-01-01T12:05:00.000Z',
  },
  sourceFiles: ['sample.trx'],
  reportPath: '_report',
};

describe('summary page generator', () => {
  it('renders failed status and failure details', () => {
    const html = renderSummaryPage(sampleRun, 'Actions Insights', 'auto');
    expect(html).toContain('FAILED');
    expect(html).toContain('SampleTests.ShouldFail');
    expect(html).toContain('Expected true but was false');
    expect(html).toContain('Skipped Tests');
  });

  it('matches golden snapshot structure', () => {
    const html = renderSummaryPage(sampleRun, 'Actions Insights', 'light');
    const goldenPath = path.join(__dirname, '..', 'golden', 'summary.html');
    if (process.env.UPDATE_GOLDEN) {
      fs.mkdirSync(path.dirname(goldenPath), { recursive: true });
      fs.writeFileSync(goldenPath, html);
    }
    if (fs.existsSync(goldenPath)) {
      const golden = fs.readFileSync(goldenPath, 'utf8');
      expect(html).toContain('FAILED');
      expect(html.length).toBeGreaterThan(1000);
      expect(golden).toContain('FAILED');
    }
  });
});
