import { describe, expect, it } from 'vitest';
import { buildReportLinks } from '../../src/reporting/links';
import { sampleRun } from './fixtures';

describe('links', () => {
  it('builds workflow and artifact links', () => {
    const links = buildReportLinks(sampleRun.context);
    expect(links.workflowRun).toBe('https://github.com/owner/repo/actions/runs/1');
    expect(links.artifacts).toBe('https://github.com/owner/repo/actions/runs/1#artifacts');
    expect(links.pullRequest).toBe('https://github.com/owner/repo/pull/42');
  });
});
