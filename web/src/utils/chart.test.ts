import { describe, expect, it } from 'vitest';
import { buildDonutSegments, buildLinearTicks, donutPaths, maxValue } from './chart';

describe('chart utils', () => {
  it('maxValue returns fallback when all values are zero', () => {
    expect(maxValue([0, 0], 1)).toBe(1);
  });

  it('maxValue returns highest value', () => {
    expect(maxValue([3, 10, 5])).toBe(10);
  });

  it('buildLinearTicks returns ascending ticks from zero', () => {
    expect(buildLinearTicks(0)).toEqual([0]);
    expect(buildLinearTicks(100, 4)).toEqual([0, 25, 50, 75, 100]);
  });

  it('buildLinearTicks deduplicates rounded ticks', () => {
    expect(buildLinearTicks(3, 3)).toEqual([0, 1, 2, 3]);
  });

  it('buildDonutSegments filters zero segments', () => {
    const segments = buildDonutSegments({ passed: 10, failed: 0, skipped: 2, inconclusive: 0 });
    expect(segments).toHaveLength(2);
    expect(segments[0].label).toBe('Passed');
    expect(segments[1].label).toBe('Skipped');
  });

  it('donutPaths returns empty string for no segments', () => {
    expect(donutPaths([], 80, 80, 60)).toBe('');
  });

  it('donutPaths generates path markup', () => {
    const paths = donutPaths(
      [{ value: 10, color: '#0a6e31' }, { value: 5, color: '#ba1a1a' }],
      80,
      80,
      60,
    );
    expect(paths).toContain('<path');
    expect(paths).toContain('fill="#0a6e31"');
  });
});
