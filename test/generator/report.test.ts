import { describe, expect, it } from 'vitest';
import { renderReportHtml } from '../../src/generator/report';
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
    successRate: 50,
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

describe('report generator', () => {
  it('renders self-contained HTML with tabs and embedded run data', () => {
    const html = renderReportHtml(sampleRun, 'Actions Insights', 'auto', 1000);

    expect(html).toContain('FAILED');
    expect(html).toContain('Expected true but was false');
    expect(html).toContain('id="run-data"');
    expect(html).toContain('panel-summary');
    expect(html).toContain('panel-tests');
    expect(html).toContain('ShouldFail');
    expect(html).not.toContain('href="assets/');
    expect(html).not.toContain('<link rel="stylesheet"');
    expect(html).toContain('<style>');
    expect(html).toContain('SampleTests');
  });

  it('groups failures by class with short names', () => {
    const html = renderReportHtml(sampleRun, 'Actions Insights', 'light', 1000);
    expect(html).toContain('failure-group-title');
    expect(html).toMatch(/failure-name[^<]*ShouldFail/);
    expect(html).toMatch(/failure-group-title[^<]*SampleTests/);
  });

  it('shows raw results note when enabled', () => {
    const run = {
      ...sampleRun,
      matchedFiles: ['sample.trx'],
    };
    const html = renderReportHtml(run, 'Actions Insights', 'auto', 1000, undefined, true);
    expect(html).toContain('raw/');
    expect(html).toContain('downloaded workflow artifact');
  });
});
