import { describe, expect, it } from 'vitest';
import type { CompactTestRecord } from '@actions-insights/history-models';
import {
  buildCodeSearchUrl,
  filterTests,
  getClassName,
  getCodeSearchName,
  getShortName,
  groupTestsByProjectAndClass,
  sortTests,
} from './testList';

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
    expect(getClassName(test)).toBe('SampleTests.SampleTests');
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

  it('sorts by duration descending', () => {
    const tests = [
      makeTest({ d: 100 }),
      makeTest({ i: 1, d: 500 }),
    ];
    const sorted = sortTests(tests, 'duration', () => null);
    expect(sorted[0].d).toBe(500);
  });
});
