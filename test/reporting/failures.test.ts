import { describe, expect, it } from 'vitest';
import { formatFailureBlock } from '../../src/reporting/failures';
import { sampleRun } from './fixtures';

describe('failures', () => {
  it('formats failure with message and stack details', () => {
    const test = sampleRun.tests[1];
    const block = formatFailureBlock(test, {
      maxStackTraceLines: 25,
      includeStdout: true,
      includeStderr: true,
      compact: true,
    });
    expect(block).toContain('SampleTests.ShouldFail');
    expect(block).toContain('Expected true but was false');
    expect(block).toContain('<details><summary>Stack trace</summary>');
    expect(block).toContain('line 42');
  });
});
