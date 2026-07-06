import { describe, expect, it } from 'vitest';
import { truncateLines, truncateText } from '../../src/reporting/truncate';

describe('truncate', () => {
  it('truncates lines', () => {
    const input = 'line1\nline2\nline3';
    const result = truncateLines(input, 2);
    expect(result.text).toBe('line1\nline2');
    expect(result.truncated).toBe(true);
    expect(result.totalLines).toBe(3);
  });

  it('returns full text when under limit', () => {
    const result = truncateLines('one line', 5);
    expect(result.truncated).toBe(false);
    expect(result.text).toBe('one line');
  });

  it('truncates by character count', () => {
    const result = truncateText('hello world', 5);
    expect(result.truncated).toBe(true);
    expect(result.text).toBe('hello…');
  });
});
