import { describe, expect, it } from 'vitest';
import { buildReportLinks, formatFooterLinks } from '../../src/reporting/links';
import { sampleRun } from './fixtures';

describe('links', () => {
  it('builds workflow and artifact links', () => {
    const links = buildReportLinks(sampleRun.context);
    expect(links.workflowRun).toBe('https://github.com/owner/repo/actions/runs/1');
    expect(links.artifacts).toBe('https://github.com/owner/repo/actions/runs/1#artifacts');
    expect(links.pullRequest).toBe('https://github.com/owner/repo/pull/42');
  });

  it('includes Actions Insights branding in footer', () => {
    const footer = formatFooterLinks(buildReportLinks(sampleRun.context));
    expect(footer).toMatch(/^Actions Insights ·/);
  });
});
