import { describe, expect, it } from 'vitest';
import { renderReportHtml } from '../../src/generator/report';
import type { TrendsFile } from '../../src/model/manifest';
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
    {
      id: 'slow',
      name: 'ShouldBeSlow',
      fullName: 'SampleTests.ShouldBeSlow',
      outcome: 'passed',
      durationMs: 2500,
      assembly: 'SampleTests.dll',
      namespace: 'SampleTests',
      className: 'SampleTests',
      method: 'ShouldBeSlow',
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

const sampleTrends: TrendsFile = {
  version: 1,
  repository: 'owner/repo',
  updatedAt: '2026-01-01T12:05:00.000Z',
  context: { branchKey: 'main', branchLabel: 'main' },
  runs: [],
  summary: {
    key: 'main',
    points: [],
    averagePassRate: 0,
    averageDurationMs: 0,
    failuresLast24h: 0,
    totalRuns: 0,
  },
  tests: {
    'SampleTests.ShouldFail': {
      passRate: 50,
      runCount: 2,
      points: [
        {
          runId: '1',
          date: '2026-01-01T12:05:00.000Z',
          o: 1,
          d: 1500,
          commitShortSha: 'abc123d',
          branchKey: 'main',
          branchLabel: 'main',
        },
      ],
    },
  },
};

describe('report generator', () => {
  it('renders self-contained HTML with tabs and embedded run data', () => {
    const html = renderReportHtml(sampleRun, 'Actions Insights', 'auto', 1000);

    expect(html).toContain('status-pill failed');
    expect(html).toContain('Expected true but was false');
    expect(html).toContain('id="run-data"');
    expect(html).toContain('panel-summary');
    expect(html).toContain('panel-tests');
    expect(html).toContain('ShouldFail');
    expect(html).toContain('header-logo');
    expect(html).toContain('data-theme=');
    expect(html).toContain('.header-logo-light { background-image: url("data:image/png;base64,');
    expect(html).toContain('.header-logo-dark { background-image: url("data:image/png;base64,');
    expect(html).not.toContain('<img class="header-logo');
    expect(html).toContain('Commit abc123d');
    expect(html).toContain('Slow tests');
    expect(html).toContain('ShouldBeSlow');
    expect(html).not.toContain('status-banner');
    expect(html).not.toContain('Recent Runs');
    expect(html).not.toContain('href="assets/');
    expect(html).not.toContain('<link rel="stylesheet"');
    expect(html).toContain('<style>');
    expect(html).toContain('SampleTests');
  });

  it('sets data-theme dark when theme input is dark', () => {
    const html = renderReportHtml(sampleRun, 'Actions Insights', 'dark', 1000);
    expect(html).toContain('data-theme="dark"');
  });

  it('embeds trends data when provided', () => {
    const html = renderReportHtml(sampleRun, 'Actions Insights', 'auto', 1000, sampleTrends);
    expect(html).toContain('id="trends-data"');
    expect(html).toContain('SampleTests.ShouldFail');
    expect(html).toContain('trends-notice hidden');
    expect(html).not.toContain('Load trends.json');
  });

  it('adds coverage tab and embeds coverage when present', () => {
    const run: TestRun = {
      ...sampleRun,
      coverage: {
        summary: { line: 42.5, branch: 30 },
        projects: [
          {
            name: 'Sample',
            metrics: { line: 42.5, branch: 30 },
            files: [{ path: 'src/Sample.cs', metrics: { line: 42.5 } }],
          },
        ],
        sourceFiles: [],
      },
    };
    const html = renderReportHtml(run, 'Actions Insights', 'auto', 1000);
    expect(html).toContain('data-tab="coverage"');
    expect(html).toContain('panel-coverage');
    expect(html).toContain('Line Coverage');
    expect(html).toContain('coverage-summary-bars');
    expect(html).toContain('"coverage":');
  });

  it('adds build tab when diagnostics or timing present', () => {
    const run: TestRun = {
      ...sampleRun,
      diagnostics: {
        summary: { errors: 1, warnings: 2 },
        items: [
          {
            severity: 'error',
            message: 'CS0001',
            file: 'Program.cs',
            line: 10,
          },
        ],
        sourceFiles: [],
      },
      workflowTiming: {
        summary: {
          workflowDurationMs: 120000,
          jobs: [],
          steps: [
            {
              jobName: 'build',
              stepName: 'Run tests',
              stepNumber: 1,
              status: 'completed',
              durationMs: 60000,
            },
          ],
          slowestStep: 'build › Run tests',
        },
      },
    };
    const html = renderReportHtml(run, 'Actions Insights', 'auto', 1000);
    expect(html).toContain('data-tab="build"');
    expect(html).toContain('panel-build');
    expect(html).toContain('"diagnostics":');
    expect(html).toContain('"timing":');
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

  it('hides failed tests section when there are no failures', () => {
    const run: TestRun = {
      ...sampleRun,
      status: 'passed',
      stats: { ...sampleRun.stats, failed: 0, passed: 3, successRate: 100 },
      tests: sampleRun.tests.filter((t) => t.outcome !== 'failed'),
    };
    const html = renderReportHtml(run, 'Actions Insights', 'auto', 1000);
    expect(html).not.toContain('Failed Tests');
    expect(html).toContain('status-pill passed');
  });
});
