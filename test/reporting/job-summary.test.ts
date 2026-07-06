import { describe, expect, it } from 'vitest';
import { buildReportingContext } from '../../src/reporting/context';
import { renderJobSummary } from '../../src/reporting/job-summary';
import { buildReportLinks } from '../../src/reporting/links';
import { sampleConfig, sampleRun } from './fixtures';

describe('job-summary', () => {
  it('renders comment-style layout with grouped failures', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const summary = renderJobSummary(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(summary).toContain('## ❌ Actions Insights');
    expect(summary).toContain('**owner/repo**');
    expect(summary).toContain('### Failed Tests');
    expect(summary).toContain('#### SampleTests');
    expect(summary).toContain('`ShouldFail`');
    expect(summary).not.toContain('| Test | Class | Duration | Details |');
    expect(summary).toContain('### All Tests');
    expect(summary).toContain('✅ `ShouldPass`');
    expect(summary).toContain('Actions Insights · [Workflow run]');
  });

  it('does not include longest test in statistics', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const summary = renderJobSummary(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(summary).not.toContain('Longest test');
  });

  it('includes slowest and skipped sections', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const summary = renderJobSummary(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(summary).toContain('### Slowest Tests');
    expect(summary).toContain('### Skipped Tests');
  });
});
