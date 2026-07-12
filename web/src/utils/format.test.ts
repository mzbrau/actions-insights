import { describe, expect, it } from 'vitest';
import { formatDateWithRelative, formatRelativeTime } from './format';

describe('formatRelativeTime', () => {
  it('returns minutes ago for recent past dates', () => {
    const now = Date.parse('2026-07-07T10:03:00.000Z');
    expect(formatRelativeTime('2026-07-07T10:00:00.000Z', now)).toMatch(/3 minute/);
  });

  it('returns minutes ahead for near future dates', () => {
    const now = Date.parse('2026-07-07T10:00:00.000Z');
    expect(formatRelativeTime('2026-07-07T10:01:00.000Z', now)).toMatch(/1 minute/);
  });
});

describe('formatDateWithRelative', () => {
  it('combines absolute and relative time', () => {
    const now = Date.parse('2026-07-07T10:03:00.000Z');
    const result = formatDateWithRelative('2026-07-07T10:00:00.000Z', now);
    expect(result).toContain('(');
    expect(result).toContain('3 minute');
    expect(result.endsWith(')')).toBe(true);
  });
});
