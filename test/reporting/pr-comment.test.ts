import { describe, expect, it } from 'vitest';
import { buildReportingContext } from '../../src/reporting/context';
import { buildReportLinks } from '../../src/reporting/links';
import {
  buildCommentMarker,
  COMMENT_MARKER,
  DEFAULT_CHECK_NAME,
  encodeCommentMarkerKey,
  isDefaultCheckName,
  renderPrComment,
} from '../../src/reporting/pr-comment';
import { sampleConfig, sampleRun } from './fixtures';
import type { PreviousRun } from '../../src/history/previous-run';

describe('comment marker', () => {
  it('builds a hex-encoded scoped marker from check-name', () => {
    expect(buildCommentMarker('Backend')).toBe(
      `<!-- actions-insights-report:${encodeCommentMarkerKey('Backend')} -->`,
    );
    expect(buildCommentMarker(DEFAULT_CHECK_NAME)).toBe(
      `<!-- actions-insights-report:${encodeCommentMarkerKey(DEFAULT_CHECK_NAME)} -->`,
    );
  });

  it('keeps distinct check-names collision-free', () => {
    expect(buildCommentMarker('CI -- unit')).not.toBe(buildCommentMarker('CI - unit'));
    expect(encodeCommentMarkerKey('CI -- unit')).not.toContain('--');
    expect(encodeCommentMarkerKey('A>B')).not.toContain('>');
  });

  it('detects the default check-name with exact equality', () => {
    expect(isDefaultCheckName(DEFAULT_CHECK_NAME)).toBe(true);
    expect(isDefaultCheckName('Backend')).toBe(false);
    expect(isDefaultCheckName('Actions> Insights')).toBe(false);
  });

  it('legacy unscoped marker is distinct from scoped markers', () => {
    expect(buildCommentMarker('Backend')).not.toContain(COMMENT_MARKER);
    expect(COMMENT_MARKER).toBe('<!-- actions-insights-report -->');
  });
});

describe('pr-comment', () => {
  it('renders status and counts above the fold', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(body).toContain(buildCommentMarker(sampleConfig.checkName));
    expect(body).not.toContain(COMMENT_MARKER);
    expect(body).toContain('❌ Failed');
    expect(body).toContain('✅ 1 passed');
    expect(body).toContain('❌ 1 failed');
    expect(body).toContain('## Failed Tests');
    expect(body).toContain('### SampleTests');
    expect(body).toContain('[`ShouldFail`]');
    expect(body).toContain('Expected true but was false');
    expect(body).toContain('<summary>Instructions for an AI agent</summary>');
    expect(body).toContain('Investigate and fix the following failing tests');
    expect(body).toContain('Actions Insights · [Workflow run]');
  });

  it('renders per-suite summary when tests have assemblies', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(body).toContain('## Per Suite Summary');
    expect(body).toContain('SampleTests.dll');
    expect(body).toContain('| Total | Passed | Failed | Skipped | Inconclusive | Time |');
  });

  it('omits per-suite summary when the only bucket is No suite', () => {
    const runWithoutAssemblies = {
      ...sampleRun,
      tests: sampleRun.tests.map((t) => ({ ...t, assembly: undefined })),
    };
    const ctx = buildReportingContext(runWithoutAssemblies, sampleConfig);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(runWithoutAssemblies.context));
    expect(body).not.toContain('## Per Suite Summary');
  });

  it('does not include longest test in statistics', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(body).not.toContain('Longest test');
  });

  it('shows push delta section when previous run differs', () => {
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
    expect(body).toContain('## Changes since last push [prev123]');
    expect(body).toContain('**🆕 New failures (1)** — tests that were previously passing');
    expect(body).toContain('ShouldFail');
  });

  it('shows base branch delta section when base run differs', () => {
    const baseBranchRun: PreviousRun = {
      commitSha: 'base1234567890',
      commitShortSha: 'base123',
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
    const run = {
      ...sampleRun,
      context: { ...sampleRun.context, prNumber: 42, baseBranch: 'main' },
    };
    const ctx = buildReportingContext(run, sampleConfig, undefined, baseBranchRun);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(run.context));
    expect(body).toContain('## Compared to [main]');
    expect(body).toContain('**🆕 New failures (1)** — tests that are passing in the base branch');
    expect(body).toContain('ShouldFail');
  });

  it('shows both base and push delta sections on PR update', () => {
    const previousRun: PreviousRun = {
      commitSha: 'prev123456789',
      commitShortSha: 'prev123',
      outcomes: new Map([
        ['SampleTests.ShouldPass', 'failed'],
        ['SampleTests.ShouldFail', 'failed'],
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
    const baseBranchRun: PreviousRun = {
      commitSha: 'base1234567890',
      commitShortSha: 'base123',
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
    const run = {
      ...sampleRun,
      context: { ...sampleRun.context, prNumber: 42, baseBranch: 'main' },
    };
    const ctx = buildReportingContext(run, sampleConfig, previousRun, baseBranchRun);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(run.context));
    expect(body).toContain('## Compared to [main]');
    expect(body).toContain('## Changes since last push [prev123]');
    expect(body).toContain('**✅ Fixed failures (1)** — tests that were previously failing');
    expect(body).toContain('**🆕 New failures (1)** — tests that are passing in the base branch');
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
    expect(body).toContain('View complete report');
    expect(body).not.toContain('View complete report in workflow artifacts');
  });

  it('emits a scoped marker for a custom check-name', () => {
    const config = { ...sampleConfig, checkName: 'Backend', reportTitle: 'Backend' };
    const body = renderPrComment(
      buildReportingContext(sampleRun, config),
      config,
      buildReportLinks(sampleRun.context),
    );
    expect(body).toContain(buildCommentMarker('Backend'));
    expect(body).toContain('# ❌ Failed — Backend');
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
