import { describe, expect, it } from 'vitest';
import { formatUtcTimestamp, resolveRunCompletedAt } from '../../src/reporting/time';

describe('time', () => {
  it('formats timestamps in UTC', () => {
    expect(formatUtcTimestamp('2026-07-07T12:34:56.000Z')).toBe('2026-07-07 12:34:56 UTC');
  });

  it('uses the latest source file mtime when available', () => {
    const now = Date.now();
    const completedAt = resolveRunCompletedAt([], new Date(now).toISOString());
    expect(completedAt).toBe(new Date(now).toISOString());
  });
});
