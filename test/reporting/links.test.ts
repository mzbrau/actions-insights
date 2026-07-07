import { describe, expect, it } from 'vitest';
import {
  buildTestCodeUrl,
  formatTestNameWithCodeLink,
  formatTestNameWithLinks,
} from '../../src/reporting/links';
import { sampleRun } from './fixtures';

describe('links', () => {
  const test = sampleRun.tests[1];

  it('formatTestNameWithCodeLink links directly to code search', () => {
    const formatted = formatTestNameWithCodeLink(sampleRun.context, 'ShouldFail', test);
    expect(formatted).toMatch(/^\[`ShouldFail`\]\(https:\/\/github\.com\/search\?q=/);
    expect(formatted).toContain('type=code');
    expect(formatted).not.toContain('([code]');
  });

  it('formatTestNameWithLinks keeps log and separate code link for PR comments', () => {
    const links = { workflowRun: 'https://example.com/run', artifacts: 'https://example.com/run#artifacts', commit: '', repository: '' };
    const formatted = formatTestNameWithLinks(sampleRun.context, links, 'ShouldFail', test);
    expect(formatted).toContain('([code](');
    expect(formatted).toContain('https://example.com/run');
  });

  it('buildTestCodeUrl strips parameters from search query', () => {
    const parameterized = {
      ...test,
      fullName: 'SampleTests.ShouldFail(key: T)',
      method: 'ShouldFail(key: T, modifiers: Control)',
    };
    const url = buildTestCodeUrl(sampleRun.context, parameterized);
    expect(url).toContain(encodeURIComponent('repo:owner/repo ShouldFail'));
    expect(url).not.toContain('key');
  });
});
