import type { TestCase } from '../model/test-case';
import { formatDuration } from '../model/test-run';
import { fenceCode, truncateLines } from './truncate';

export interface FailureFormatOptions {
  maxStackTraceLines: number;
  includeStdout: boolean;
  includeStderr: boolean;
  compact?: boolean;
}

export function selectFailedTests(tests: TestCase[], limit: number): TestCase[] {
  if (limit <= 0) return [];
  const failed = tests.filter((t) => t.outcome === 'failed');
  failed.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return failed.slice(0, limit);
}

export function countFailedTests(tests: TestCase[]): number {
  let count = 0;
  for (const test of tests) {
    if (test.outcome === 'failed') count++;
  }
  return count;
}

export function formatFailureBlock(
  test: TestCase,
  options: FailureFormatOptions,
  displayName?: string,
): string {
  const lines: string[] = [];
  const newTag = test.isNewFailure ? ' 🆕' : '';
  const name = displayName ?? test.fullName;
  const className = test.className ?? test.namespace ?? '—';
  const project = test.assembly ?? '—';

  if (options.compact) {
    lines.push(`❌ \`${name}\`${newTag} · ${formatDuration(test.durationMs)}`);
  } else if (displayName) {
    lines.push(`❌ \`${name}\`${newTag} · ${formatDuration(test.durationMs)}`);
    if (project !== '—') {
      lines.push(`Project: \`${project}\``);
    }
  } else {
    lines.push(`❌ \`${test.fullName}\`${newTag}`);
    lines.push(`Class: \`${className}\` · Project: \`${project}\` · ${formatDuration(test.durationMs)}`);
  }

  if (test.message) {
    lines.push('');
    lines.push('**Message:**');
    lines.push('');
    lines.push(fenceCode(test.message));
  }

  if (test.stackTrace) {
    const stack = truncateLines(test.stackTrace, options.maxStackTraceLines);
    const summary = stack.truncated
      ? `Stack trace (${options.maxStackTraceLines} of ${stack.totalLines} lines)`
      : 'Stack trace';
    lines.push('');
    lines.push(`<details><summary>${summary}</summary>`);
    lines.push('');
    lines.push(fenceCode(stack.text));
    lines.push('');
    lines.push('</details>');
  }

  if (options.includeStdout && test.stdout?.trim()) {
    const stdout = truncateLines(test.stdout, options.maxStackTraceLines);
    lines.push('');
    lines.push('<details><summary>Stdout</summary>');
    lines.push('');
    lines.push(fenceCode(stdout.text));
    lines.push('');
    lines.push('</details>');
  }

  if (options.includeStderr && test.stderr?.trim()) {
    const stderr = truncateLines(test.stderr, options.maxStackTraceLines);
    lines.push('');
    lines.push('<details><summary>Stderr</summary>');
    lines.push('');
    lines.push(fenceCode(stderr.text));
    lines.push('');
    lines.push('</details>');
  }

  return lines.join('\n');
}

export function formatGroupedFailures(
  failedTests: TestCase[],
  maxCount: number,
  options: FailureFormatOptions,
  getShortName: (test: TestCase) => string,
  groupByClass: (tests: TestCase[]) => Array<{ qualifiedClassName: string; tests: TestCase[] }>,
): string[] {
  const lines: string[] = [];
  const shown = failedTests.slice(0, maxCount);
  const groups = groupByClass(shown);

  for (const group of groups) {
    lines.push(`#### ${group.qualifiedClassName}`);
    for (const test of group.tests) {
      lines.push(formatFailureBlock(test, options, getShortName(test)));
      lines.push('');
    }
  }

  return lines;
}

export function formatFailureTableRow(test: TestCase, options: FailureFormatOptions): string {
  const message = test.message?.replace(/\|/g, '\\|').replace(/\n/g, ' ') ?? '—';
  const className = (test.className ?? test.namespace ?? '—').replace(/\|/g, '\\|');
  let details = message;

  if (test.stackTrace) {
    const stack = truncateLines(test.stackTrace, options.maxStackTraceLines);
    const summary = stack.truncated
      ? `Stack (${options.maxStackTraceLines}/${stack.totalLines} lines)`
      : 'Stack trace';
    details += `<br><details><summary>${summary}</summary>${fenceCode(stack.text)}</details>`;
  }

  return `| \`${test.fullName.replace(/\|/g, '\\|')}\` | ${className} | ${formatDuration(test.durationMs)} | ${details} |`;
}
