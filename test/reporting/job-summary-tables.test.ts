import { describe, expect, it } from 'vitest';
import type { TestCase } from '../../src/model/test-case';
import {
  formatCountCell,
  formatJobSummaryTestTables,
  formatReportLabel,
  groupTestsBySourceFile,
} from '../../src/reporting/all-tests-summary';
import { buildReportLinks, formatTestNameWithCodeLinkForTable } from '../../src/reporting/links';
import { sampleRun } from './fixtures';

function makeTest(overrides: Partial<TestCase> & Pick<TestCase, 'fullName' | 'outcome'>): TestCase {
  const method = overrides.fullName.includes('.')
    ? overrides.fullName.slice(overrides.fullName.lastIndexOf('.') + 1)
    : overrides.fullName;
  const className = overrides.fullName.includes('.')
    ? overrides.fullName.slice(0, overrides.fullName.lastIndexOf('.'))
    : 'Tests';
  return {
    id: overrides.fullName,
    name: method,
    fullName: overrides.fullName,
    outcome: overrides.outcome,
    durationMs: overrides.durationMs ?? 10,
    assembly: overrides.assembly,
    namespace: className,
    className,
    method,
    attachments: [],
    traits: [],
    categories: [],
    retries: 0,
    sourceFile: overrides.sourceFile ?? 'sample.trx',
    ...overrides,
  };
}

describe('job-summary tables', () => {
  it('formats count cells with emoji before number', () => {
    expect(formatCountCell(5, '✅')).toBe('✅5');
    expect(formatCountCell(0, '✅')).toBe('');
  });

  it('formats report labels from nested paths', () => {
    expect(formatReportLabel('unit-test-results/unit-test-results.trx')).toBe(
      'unit-test-results/unit-test-results.trx',
    );
    expect(formatReportLabel('/home/runner/work/repo/repo/out.trx')).toBe('repo/out.trx');
  });

  it('groups tests by source file using sourceFiles order', () => {
    const tests = [
      makeTest({ fullName: 'A.One', outcome: 'passed', sourceFile: 'b.trx' }),
      makeTest({ fullName: 'B.Two', outcome: 'passed', sourceFile: 'a.trx' }),
    ];
    const groups = groupTestsBySourceFile(tests, ['a.trx', 'b.trx']);
    expect(groups.map((g) => g.sourceFile)).toEqual(['a.trx', 'b.trx']);
  });

  it('renders overview, run, and collapsed class detail tables with anchors', () => {
    const tests = [
      makeTest({ fullName: 'SampleTests.ShouldPass', outcome: 'passed', durationMs: 123 }),
      makeTest({ fullName: 'SampleTests.ShouldFail', outcome: 'failed', durationMs: 1500 }),
      makeTest({ fullName: 'SampleTests.ShouldSkip', outcome: 'skipped', durationMs: 10 }),
    ];
    const links = buildReportLinks(sampleRun.context);
    const formatName = (t: TestCase) => `[\`${t.method}\`](https://github.com/search?q=test&type=code)`;
    const section = formatJobSummaryTestTables(tests, ['sample.trx'], links, formatName).join('\n');

    expect(section).toContain('| Report | Passed | Failed | Skipped | Time |');
    expect(section).toContain('[sample.trx](#run-0)');
    expect(section).toContain('<a id="run-0"></a>');
    expect(section).toContain('| Test suite | Passed | Failed | Skipped | Time |');
    expect(section).toContain('[SampleTests](#run-0-class-0)');
    expect(section).toContain('<details><summary>❌ SampleTests</summary>');
    expect(section).toContain('| Test | Result | Time |');
    expect(section).toContain('| [`ShouldPass`](https://github.com/search?q=test&type=code) | ✅ | 123ms |');
  });

  it('renders multiple source files as separate runs', () => {
    const tests = [
      makeTest({ fullName: 'A.One', outcome: 'passed', sourceFile: 'unit.trx' }),
      makeTest({ fullName: 'B.Two', outcome: 'passed', sourceFile: 'integration.trx' }),
    ];
    const links = buildReportLinks(sampleRun.context);
    const section = formatJobSummaryTestTables(tests, ['unit.trx', 'integration.trx'], links).join('\n');

    expect(section).toContain('[unit.trx](#run-0)');
    expect(section).toContain('[integration.trx](#run-1)');
    expect(section).toContain('<a id="run-1"></a>');
  });

  it('renders pipe-containing test names without breaking table columns', () => {
    const tests = [
      makeTest({
        fullName: 'SampleTests.Shortcut_matches',
        outcome: 'passed',
        method: 'Shortcut_matches(key: K, modifiers: Alt | Control, expected: False)',
      }),
    ];
    const links = buildReportLinks(sampleRun.context);
    const formatName = (t: TestCase) =>
      formatTestNameWithCodeLinkForTable(sampleRun.context, t.method ?? t.name, t);
    const section = formatJobSummaryTestTables(tests, ['sample.trx'], links, formatName).join('\n');
    const detailLine = section
      .split('\n')
      .find((line) => line.includes('Shortcut_matches'));

    expect(detailLine).toBeDefined();
    expect(detailLine).toMatch(/\| \[Shortcut_matches\(key: K, modifiers: Alt \\| Control, expected: False\)\]\(/);
    expect(detailLine).toMatch(/\| ✅ \| \d+ms \|$/);
  });

  it('renders all tests without truncation', () => {
    const tests = Array.from({ length: 50 }, (_, i) =>
      makeTest({ fullName: `BulkTests.Class.Test${i}`, outcome: 'passed' }),
    );
    const links = buildReportLinks(sampleRun.context);
    const section = formatJobSummaryTestTables(tests, ['sample.trx'], links).join('\n');

    expect(section).not.toContain('…and');
    expect(section).not.toContain('more tests');
    for (let i = 0; i < 50; i++) {
      expect(section).toContain(`Test${i}`);
    }
  });
});
