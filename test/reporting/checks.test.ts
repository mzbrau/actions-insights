import { describe, expect, it } from 'vitest';
import { parseStackLocation, buildCheckAnnotations } from '../../src/reporting/checks';
import { sampleRun } from './fixtures';

describe('checks', () => {
  it('parses .NET stack trace locations', () => {
    const location = parseStackLocation('at SampleTests.ShouldFail() in SampleTests.cs:line 42');
    expect(location).toEqual({ path: 'SampleTests.cs', line: 42 });
  });

  it('builds annotations from failed tests', () => {
    const failed = sampleRun.tests.filter((t) => t.outcome === 'failed');
    const annotations = buildCheckAnnotations(failed, 50, 25);
    expect(annotations).toHaveLength(1);
    expect(annotations[0].path).toBe('SampleTests.cs');
    expect(annotations[0].start_line).toBe(42);
    expect(annotations[0].title).toContain('ShouldFail');
  });
});
