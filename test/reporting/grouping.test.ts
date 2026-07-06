import { describe, expect, it } from 'vitest';
import {
  getQualifiedClassName,
  getShortTestName,
  groupTestsByClass,
  groupTestsByClassWithFailuresFirst,
} from '../../src/reporting/grouping';
import type { TestCase } from '../../src/model/test-case';

function makeTest(overrides: Partial<TestCase> & Pick<TestCase, 'fullName' | 'name' | 'outcome'>): TestCase {
  return {
    id: '1',
    durationMs: 100,
    attachments: [],
    traits: [],
    categories: [],
    retries: 0,
    sourceFile: 'test.trx',
    ...overrides,
  };
}

describe('grouping', () => {
  it('derives qualified class name from TRX-style metadata', () => {
    const test = makeTest({
      fullName: 'Notey.Tests.MainWindowShortcutTests.IsNewTaskShortcut_matches',
      name: 'IsNewTaskShortcut_matches',
      method: 'IsNewTaskShortcut_matches',
      namespace: 'Notey.Tests',
      className: 'MainWindowShortcutTests',
      outcome: 'failed',
    });
    expect(getQualifiedClassName(test)).toBe('Notey.Tests.MainWindowShortcutTests');
    expect(getShortTestName(test)).toBe('IsNewTaskShortcut_matches');
  });

  it('derives class from fullName when method suffix matches', () => {
    const test = makeTest({
      fullName: 'SampleTests.ShouldFail',
      name: 'ShouldFail',
      method: 'ShouldFail',
      outcome: 'failed',
    });
    expect(getQualifiedClassName(test)).toBe('SampleTests');
    expect(getShortTestName(test)).toBe('ShouldFail');
  });

  it('groups tests by class alphabetically', () => {
    const tests = [
      makeTest({ fullName: 'B.Tests.TestOne', name: 'TestOne', method: 'TestOne', outcome: 'passed' }),
      makeTest({ fullName: 'A.Tests.TestTwo', name: 'TestTwo', method: 'TestTwo', outcome: 'failed' }),
    ];
    const groups = groupTestsByClass(tests);
    expect(groups).toHaveLength(2);
    expect(groups[0].qualifiedClassName).toBe('A.Tests');
    expect(groups[1].qualifiedClassName).toBe('B.Tests');
  });

  it('sorts classes with failures first', () => {
    const tests = [
      makeTest({ fullName: 'B.Tests.TestOne', name: 'TestOne', method: 'TestOne', outcome: 'passed' }),
      makeTest({ fullName: 'A.Tests.TestTwo', name: 'TestTwo', method: 'TestTwo', outcome: 'failed' }),
    ];
    const groups = groupTestsByClassWithFailuresFirst(tests);
    expect(groups[0].qualifiedClassName).toBe('A.Tests');
  });
});
