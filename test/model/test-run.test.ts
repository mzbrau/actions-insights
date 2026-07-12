import { describe, expect, it } from 'vitest';
import { computeStats } from '../../src/model/test-run';
import type { TestCase } from '../../src/model/test-case';

function makeTest(outcome: TestCase['outcome']): TestCase {
  return {
    id: outcome,
    name: outcome,
    fullName: `SampleTests.${outcome}`,
    outcome,
    durationMs: 100,
    attachments: [],
    traits: [],
    categories: [],
  };
}

describe('computeStats', () => {
  it('excludes skipped tests from success rate', () => {
    const stats = computeStats([
      makeTest('passed'),
      makeTest('passed'),
      makeTest('skipped'),
      makeTest('skipped'),
    ]);
    expect(stats.successRate).toBe(100);
  });

  it('computes success rate from passed and failed only', () => {
    const stats = computeStats([
      makeTest('passed'),
      makeTest('failed'),
      makeTest('skipped'),
    ]);
    expect(stats.successRate).toBe(50);
  });

  it('returns 0% when all tests are skipped', () => {
    const stats = computeStats([makeTest('skipped'), makeTest('skipped')]);
    expect(stats.successRate).toBe(0);
  });
});
