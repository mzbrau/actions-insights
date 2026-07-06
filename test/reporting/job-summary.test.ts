import { describe, expect, it } from 'vitest';
import { buildReportingContext } from '../../src/reporting/context';
import { renderJobSummary } from '../../src/reporting/job-summary';
import { buildReportLinks } from '../../src/reporting/links';
import { sampleConfig, sampleRun } from './fixtures';

describe('job-summary', () => {
  it('renders TeamCity-style tables', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const summary = renderJobSummary(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(summary).toContain('## ❌ Actions Insights');
    expect(summary).toContain('### Failed Tests');
    expect(summary).toContain('| Test | Class | Duration | Details |');
    expect(summary).toContain('### Slowest Tests');
    expect(summary).toContain('### Skipped Tests');
    expect(summary).toContain('### Links');
    expect(summary).toContain('SampleTests.ShouldFail');
  });
});
