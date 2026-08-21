import type { TestCase } from '../model/test-case';
import { formatDuration } from '../model/test-run';
import { escapeTableCell } from './markdown';

export interface SuiteSummary {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  inconclusive: number;
  durationMs: number;
}

export function suiteNameForTest(test: TestCase): string {
  return test.assembly?.trim() || 'No suite';
}

export function computeSuiteSummaries(tests: TestCase[]): SuiteSummary[] {
  const buckets = new Map<string, SuiteSummary>();

  for (const test of tests) {
    const suite = suiteNameForTest(test);
    let entry = buckets.get(suite);
    if (!entry) {
      entry = {
        suite,
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        inconclusive: 0,
        durationMs: 0,
      };
      buckets.set(suite, entry);
    }

    entry.total += 1;
    entry.durationMs += test.durationMs;
    switch (test.outcome) {
      case 'passed':
        entry.passed += 1;
        break;
      case 'failed':
        entry.failed += 1;
        break;
      case 'skipped':
        entry.skipped += 1;
        break;
      case 'inconclusive':
        entry.inconclusive += 1;
        break;
    }
  }

  return [...buckets.values()].sort((a, b) => a.suite.localeCompare(b.suite));
}

export function shouldShowSuiteSummary(summaries: SuiteSummary[]): boolean {
  return summaries.length > 1 || (summaries.length === 1 && summaries[0].suite !== 'No suite');
}

export function formatSuiteSummaryMarkdown(summaries: SuiteSummary[]): string {
  const lines: string[] = [
    '## Per Suite Summary',
    '',
    '| Suite | Total | Passed | Failed | Skipped | Inconclusive | Time |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const summary of summaries) {
    const statusEmoji = summary.failed > 0 ? '❌' : summary.skipped === summary.total ? '⏭' : '✅';
    lines.push(
      `| ${statusEmoji} ${escapeTableCell(summary.suite)} | ${summary.total.toLocaleString()} | ${summary.passed.toLocaleString()} | ${summary.failed.toLocaleString()} | ${summary.skipped.toLocaleString()} | ${summary.inconclusive.toLocaleString()} | ${formatDuration(summary.durationMs)} |`,
    );
  }

  return lines.join('\n');
}
