import { describe, expect, it } from 'vitest';
import { buildReportingContext } from '../../src/reporting/context';
import { renderJobSummary } from '../../src/reporting/job-summary';
import { buildReportLinks } from '../../src/reporting/links';
import { sampleConfig, sampleRun } from './fixtures';

describe('job-summary', () => {
  it('renders header, report link, failures, and hierarchical all-tests tables', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const links = buildReportLinks(sampleRun.context);
    const summary = renderJobSummary(ctx, sampleConfig, links);
    const reportIndex = summary.indexOf('[Report](');
    const failedIndex = summary.indexOf('## Failed Tests');

    expect(summary).toContain('# ❌ Actions Insights');
    expect(summary).toContain('**owner/repo**');
    expect(reportIndex).toBeGreaterThan(-1);
    expect(reportIndex).toBeLessThan(failedIndex);
    expect(summary).toContain(`[Report](${links.artifacts})`);
    expect(summary).toContain('## Failed Tests');
    expect(summary).toContain('### SampleTests');
    expect(summary).toContain('[`ShouldFail`]');
    expect(summary).toContain('<summary>Instructions for an AI agent</summary>');
    expect(summary).toContain('Investigate and fix the following failing tests');
    expect(summary).not.toContain('| Test | Class | Duration | Details |');
    expect(summary).toContain('## All Tests');
    expect(summary).toContain('| Report | Passed | Failed | Skipped | Time |');
    expect(summary).toContain('| Test suite | Passed | Failed | Skipped | Time |');
    expect(summary).toContain('<details><summary>❌ SampleTests</summary>');
    expect(summary).toContain('| Test | Result | Time |');
    expect(summary).toContain('[sample.trx](#run-0)');
    expect(summary).toContain('[SampleTests](#run-0-class-0)');
    expect(summary).toContain('Actions Insights · [Workflow run]');
  });

  it('links test names to code search without separate code or log links', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const summary = renderJobSummary(ctx, sampleConfig, buildReportLinks(sampleRun.context));

    expect(summary).toContain('github.com/search?q=');
    expect(summary).toContain('type=code');
    expect(summary).not.toContain('([code](');
    expect(summary).not.toContain('[`ShouldFail`](https://github.com/owner/repo/actions/runs/1)');
  });

  it('does not include longest test in statistics', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const summary = renderJobSummary(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(summary).not.toContain('Longest test');
  });

  it('includes slowest and skipped sections', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const summary = renderJobSummary(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(summary).toContain('## Slowest Tests');
    expect(summary).toContain('## Skipped Tests');
  });

  it('can omit all-tests tables for compact check-run output', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const links = buildReportLinks(sampleRun.context);
    const summary = renderJobSummary(ctx, sampleConfig, links, { includeAllTestsTables: false });

    expect(summary).toContain('## Failed Tests');
    expect(summary).toContain('## Statistics');
    expect(summary).not.toContain('## All Tests');
  });

  it('truncates output when maxLength is exceeded', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const links = buildReportLinks(sampleRun.context);
    const summary = renderJobSummary(ctx, sampleConfig, links, { maxLength: 200 });

    expect(summary.length).toBeLessThanOrEqual(200);
    expect(summary).toContain('Summary truncated');
    expect(summary).toContain(links.artifacts);
  });
});
