import { describe, expect, it } from 'vitest';
import type { CompactTestRecord } from '@actions-insights/history-models';
import {
  buildCodeSearchUrl,
  filterTests,
  getClassName,
  getClassNameFromFullName,
  getCodeSearchName,
  getProblematicTests,
  getShortName,
  getShortNameFromFullName,
  groupTestsByProjectAndClass,
  sortTests,
} from './testList';
import type { TestHistoryEntry } from '@actions-insights/history-models';

function makeTest(overrides: Partial<CompactTestRecord> = {}): CompactTestRecord {
  return {
    i: 0,
    n: 'MyProject.SampleTests.ShouldPass',
    o: 0,
    d: 100,
    a: 'MyProject',
    ns: 'SampleTests',
    c: 'SampleTests',
    m: 'ShouldPass',
    ...overrides,
  };
}

describe('testList', () => {
  it('extracts short and code search names', () => {
    const test = makeTest();
    expect(getShortName(test)).toBe('ShouldPass');
    expect(getCodeSearchName(test)).toBe('ShouldPass');
    expect(getClassName(test)).toBe('MyProject.SampleTests');
  });

  it('builds GitHub code search URL', () => {
    const url = buildCodeSearchUrl('owner/repo', makeTest());
    expect(url).toContain('github.com/search');
    expect(url).toContain('repo%3Aowner%2Frepo');
    expect(url).toContain('ShouldPass');
  });

  it('filters by outcome and search', () => {
    const tests = [
      makeTest({ n: 'A.Pass', o: 0 }),
      makeTest({ i: 1, n: 'A.Fail', o: 1 }),
    ];
    const failed = filterTests(tests, {
      search: '',
      filters: new Set(['failed']),
      slowThreshold: 1000,
    });
    expect(failed).toHaveLength(1);
    expect(failed[0].n).toBe('A.Fail');

    const searched = filterTests(tests, {
      search: 'pass',
      filters: new Set(),
      slowThreshold: 1000,
    });
    expect(searched).toHaveLength(1);
  });

  it('groups by project and class in default mode', () => {
    const tests = [
      makeTest({ n: 'MyProject.Foo.Bar', a: 'MyProject', ns: 'Foo', c: 'Bar' }),
      makeTest({ i: 1, n: 'MyProject.Foo.Baz', a: 'MyProject', ns: 'Foo', c: 'Bar' }),
    ];
    const grouped = groupTestsByProjectAndClass(tests);
    expect(grouped.get('MyProject')?.get('Foo.Bar')).toHaveLength(2);
  });

  it('groups tests by method-aware class name when m is present', () => {
    const className = 'Fig.Unit.Test.DistributedLockTests';
    const tests = [
      makeTest({
        a: undefined,
        n: `${className}.AcquireLockAsync_ShouldHandleHighConcurrency`,
        m: 'AcquireLockAsync_ShouldHandleHighConcurrency',
        ns: 'Fig.Unit.Test',
        c: 'DistributedLockTests',
      }),
      makeTest({
        i: 1,
        a: undefined,
        n: `${className}.AcquireLockAsync_ShouldReleaseLockOnDispose`,
        m: 'AcquireLockAsync_ShouldReleaseLockOnDispose',
        ns: 'Fig.Unit.Test',
        c: 'DistributedLockTests',
      }),
    ];
    const grouped = groupTestsByProjectAndClass(tests);
    expect(grouped.get('—')?.get(className)).toHaveLength(2);
  });

  it('uses method suffix instead of last dot when method contains dots', () => {
    const test = makeTest({
      n: 'Namespace.Class.part1.part2',
      m: 'part1.part2',
      ns: 'Namespace',
      c: 'Class',
    });
    expect(getClassName(test)).toBe('Namespace.Class');
  });

  it('sorts by duration descending', () => {
    const tests = [
      makeTest({ d: 100 }),
      makeTest({ i: 1, d: 500 }),
    ];
    const sorted = sortTests(tests, 'duration', () => null);
    expect(sorted[0].d).toBe(500);
  });

  it('derives short and class names from full test name', () => {
    expect(getShortNameFromFullName('SampleTests.ShouldPass')).toBe('ShouldPass');
    expect(getClassNameFromFullName('SampleTests.ShouldPass')).toBe('SampleTests');
  });

  it('returns problematic tests below threshold sorted worst-first', () => {
    const trends: Record<string, TestHistoryEntry> = {
      'A.Pass': { passRate: 100, runCount: 5, points: [] },
      'B.Fail': { passRate: 0, runCount: 3, points: [] },
      'C.Flaky': { passRate: 80, runCount: 10, points: [] },
      'D.SkipOnly': { passRate: 0, runCount: 0, points: [] },
      'E.Edge': { passRate: 95, runCount: 20, points: [] },
    };

    const result = getProblematicTests(trends, 95);
    expect(result.map((t) => t.name)).toEqual(['B.Fail', 'C.Flaky']);
    expect(result[0].entry.passRate).toBe(0);
  });

  it('returns empty array for null or empty trends', () => {
    expect(getProblematicTests(null, 95)).toEqual([]);
    expect(getProblematicTests({}, 95)).toEqual([]);
  });
});
