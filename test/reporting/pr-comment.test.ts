import { describe, expect, it } from 'vitest';
import { buildReportingContext } from '../../src/reporting/context';
import { buildReportLinks } from '../../src/reporting/links';
import { COMMENT_MARKER, renderPrComment } from '../../src/reporting/pr-comment';
import { sampleConfig, sampleRun } from './fixtures';
import type { PreviousRun } from '../../src/history/previous-run';

describe('pr-comment', () => {
  it('renders status and counts above the fold', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(body).toContain(COMMENT_MARKER);
    expect(body).toContain('❌ Failed');
    expect(body).toContain('✅ 1 passed');
    expect(body).toContain('❌ 1 failed');
    expect(body).toContain('## Failed Tests');
    expect(body).toContain('### SampleTests');
    expect(body).toContain('[`ShouldFail`]');
    expect(body).toContain('Expected true but was false');
    expect(body).toContain('Actions Insights · [Workflow run]');
  });

  it('does not include longest test in statistics', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(body).not.toContain('Longest test');
  });

  it('shows delta section when previous run differs', () => {
    const previousRun: PreviousRun = {
      commitSha: 'prev123456789',
      commitShortSha: 'prev123',
      outcomes: new Map([
        ['SampleTests.ShouldPass', 'passed'],
        ['SampleTests.ShouldFail', 'passed'],
        ['SampleTests.ShouldSkip', 'skipped'],
      ]),
      durations: new Map([
        ['SampleTests.ShouldPass', 10],
        ['SampleTests.ShouldFail', 10],
        ['SampleTests.ShouldSkip', 5],
      ]),
      testNames: new Set([
        'SampleTests.ShouldPass',
        'SampleTests.ShouldFail',
        'SampleTests.ShouldSkip',
      ]),
    };
    const ctx = buildReportingContext(sampleRun, sampleConfig, previousRun);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(body).toContain('## Changes since [prev123]');
    expect(body).toContain('**🆕 New failures (1)**');
    expect(body).toContain('ShouldFail');
  });

  it('truncates many failures', () => {
    const manyFailures = Array.from({ length: 15 }, (_, i) => ({
      ...sampleRun.tests[1],
      id: `fail-${i}`,
      fullName: `Tests.TestClass.Test${i}`,
      name: `Test${i}`,
      method: `Test${i}`,
      namespace: 'Tests',
      className: 'TestClass',
    }));
    const run = {
      ...sampleRun,
      stats: { ...sampleRun.stats, failed: 15, total: 17 },
      tests: [...sampleRun.tests, ...manyFailures],
    };
    const config = { ...sampleConfig, maxFailedTestsInComment: 10 };
    const body = renderPrComment(buildReportingContext(run, config), config, buildReportLinks(run.context));
    expect(body).toContain('…and 6 additional failed tests');
    expect(body).toContain('View complete report in workflow artifacts');
  });

  it('collapses slow tests beyond top 3', () => {
    const slowTests = Array.from({ length: 6 }, (_, i) => ({
      ...sampleRun.tests[0],
      id: `slow-${i}`,
      fullName: `SlowTests.Class.Test${i}`,
      name: `Test${i}`,
      method: `Test${i}`,
      namespace: 'SlowTests',
      className: 'Class',
      durationMs: (6 - i) * 2000,
    }));
    const run = {
      ...sampleRun,
      tests: slowTests,
      stats: { ...sampleRun.stats, total: 6, passed: 6 },
    };
    const config = { ...sampleConfig, includeSlowestTests: 18 };
    const body = renderPrComment(buildReportingContext(run, config), config, buildReportLinks(run.context));
    expect(body).toContain('## Slowest Tests');
    expect(body).toContain('<details><summary>3 more slow tests</summary>');
  });
});
