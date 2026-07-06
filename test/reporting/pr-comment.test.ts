import { describe, expect, it } from 'vitest';
import { buildReportingContext } from '../../src/reporting/context';
import { buildReportLinks } from '../../src/reporting/links';
import { COMMENT_MARKER, renderPrComment } from '../../src/reporting/pr-comment';
import { sampleConfig, sampleRun } from './fixtures';

describe('pr-comment', () => {
  it('renders status and counts above the fold', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(sampleRun.context));
    expect(body).toContain(COMMENT_MARKER);
    expect(body).toContain('❌ Failed');
    expect(body).toContain('✅ 1 passed');
    expect(body).toContain('❌ 1 failed');
    expect(body).toContain('### Failed Tests');
    expect(body).toContain('SampleTests.ShouldFail');
    expect(body).toContain('Expected true but was false');
    expect(body).toContain('[Workflow run]');
  });

  it('truncates many failures', () => {
    const manyFailures = Array.from({ length: 15 }, (_, i) => ({
      ...sampleRun.tests[1],
      id: `fail-${i}`,
      fullName: `Tests.Test${i}`,
      name: `Test${i}`,
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
});
