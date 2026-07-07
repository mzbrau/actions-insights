import type { TestCase } from '../model/test-case';
import { formatDuration } from '../model/test-run';
import type { ReportLinks } from './links';
import { groupTestsByClassWithFailuresFirst } from './grouping';
import { escapeTableCell } from './markdown';
import { outcomeEmoji } from './slow-tests';

export interface SourceFileGroup {
  sourceFile: string;
  label: string;
  tests: TestCase[];
}

interface OutcomeCounts {
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

export function formatReportLabel(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return `${segments[segments.length - 2]}/${segments[segments.length - 1]}`;
  }
  return segments[segments.length - 1] ?? path;
}

export function runAnchorId(runIndex: number): string {
  return `run-${runIndex}`;
}

export function classAnchorId(runIndex: number, classIndex: number): string {
  return `run-${runIndex}-class-${classIndex}`;
}

export function groupTestsBySourceFile(
  tests: TestCase[],
  sourceFileOrder?: string[],
): SourceFileGroup[] {
  const buckets = new Map<string, TestCase[]>();

  for (const test of tests) {
    const key = test.sourceFile?.trim() || 'unknown';
    const existing = buckets.get(key);
    if (existing) {
      existing.push(test);
    } else {
      buckets.set(key, [test]);
    }
  }

  const orderedKeys: string[] = [];
  if (sourceFileOrder?.length) {
    for (const file of sourceFileOrder) {
      if (buckets.has(file) && !orderedKeys.includes(file)) {
        orderedKeys.push(file);
      }
    }
  }

  const remaining = [...buckets.keys()]
    .filter((key) => !orderedKeys.includes(key))
    .sort((a, b) => a.localeCompare(b));
  orderedKeys.push(...remaining);

  return orderedKeys.map((sourceFile) => ({
    sourceFile,
    label: formatReportLabel(sourceFile),
    tests: buckets.get(sourceFile) ?? [],
  }));
}

export function countOutcomes(tests: TestCase[]): OutcomeCounts {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let durationMs = 0;
  for (const test of tests) {
    durationMs += test.durationMs;
    if (test.outcome === 'passed') passed++;
    else if (test.outcome === 'failed') failed++;
    else if (test.outcome === 'skipped') skipped++;
  }
  return { passed, failed, skipped, durationMs };
}

export function formatCountCell(count: number, emoji: string): string {
  return count > 0 ? `${emoji}${count}` : '';
}

function classStatusEmoji(tests: TestCase[]): string {
  const counts = countOutcomes(tests);
  if (counts.failed > 0) return '❌';
  if (tests.length > 0 && counts.skipped === tests.length) return '⏭';
  return '✅';
}

function formatRunSummarySentence(counts: OutcomeCounts): string {
  const total = counts.passed + counts.failed + counts.skipped;
  const parts = [
    `${counts.passed.toLocaleString()} passed`,
    `${counts.failed.toLocaleString()} failed`,
    `${counts.skipped.toLocaleString()} skipped`,
  ];
  return `${total.toLocaleString()} tests were completed in ${formatDuration(counts.durationMs)} with ${parts.join(', ')}.`;
}

function formatOverviewRow(runIndex: number, group: SourceFileGroup): string {
  const counts = countOutcomes(group.tests);
  const anchor = runAnchorId(runIndex);
  const statusEmoji = counts.failed > 0 ? '❌' : '✅';
  return `| ${statusEmoji} [${escapeTableCell(group.label)}](#${anchor}) | ${formatCountCell(counts.passed, '✅')} | ${formatCountCell(counts.failed, '❌')} | ${formatCountCell(counts.skipped, '⏭')} | ${formatDuration(counts.durationMs)} |`;
}

function formatClassSummaryRow(
  runIndex: number,
  classIndex: number,
  qualifiedClassName: string,
  tests: TestCase[],
): string {
  const counts = countOutcomes(tests);
  const anchor = classAnchorId(runIndex, classIndex);
  return `| [${escapeTableCell(qualifiedClassName)}](#${anchor}) | ${formatCountCell(counts.passed, '✅')} | ${formatCountCell(counts.failed, '❌')} | ${formatCountCell(counts.skipped, '⏭')} | ${formatDuration(counts.durationMs)} |`;
}

function formatClassDetailBlock(
  runIndex: number,
  classIndex: number,
  qualifiedClassName: string,
  tests: TestCase[],
  formatName: (test: TestCase) => string,
): string[] {
  const anchor = classAnchorId(runIndex, classIndex);
  const statusEmoji = classStatusEmoji(tests);
  const lines: string[] = [
    `<a id="${anchor}"></a>`,
    `<details><summary>${statusEmoji} ${escapeTableCell(qualifiedClassName)}</summary>`,
    '',
    '| Test | Result | Time |',
    '| --- | --- | --- |',
  ];

  for (const test of tests) {
    lines.push(
      `| ${formatName(test)} | ${outcomeEmoji(test.outcome)} | ${formatDuration(test.durationMs)} |`,
    );
  }

  lines.push('', '</details>', '');
  return lines;
}

function formatRunSection(
  runIndex: number,
  group: SourceFileGroup,
  formatName: (test: TestCase) => string,
): string[] {
  const counts = countOutcomes(group.tests);
  const anchor = runAnchorId(runIndex);
  const statusEmoji = counts.failed > 0 ? '❌' : '✅';
  const classGroups = groupTestsByClassWithFailuresFirst(group.tests);

  const lines: string[] = [
    `<a id="${anchor}"></a>`,
    `## ${statusEmoji} ${group.label}`,
    '',
    formatRunSummarySentence(counts),
    '',
    '| Test suite | Passed | Failed | Skipped | Time |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (let classIndex = 0; classIndex < classGroups.length; classIndex++) {
    const classGroup = classGroups[classIndex];
    lines.push(
      formatClassSummaryRow(runIndex, classIndex, classGroup.qualifiedClassName, classGroup.tests),
    );
  }

  lines.push('');
  return lines;
}

export function formatJobSummaryTestTables(
  tests: TestCase[],
  sourceFiles: string[] | undefined,
  _links: ReportLinks,
  formatName: (test: TestCase) => string = (t) => `\`${t.fullName}\``,
): string[] {
  if (tests.length === 0) return [];

  const fileGroups = groupTestsBySourceFile(tests, sourceFiles);
  const lines: string[] = [
    `## All Tests (${tests.length.toLocaleString()})`,
    '',
    '| Report | Passed | Failed | Skipped | Time |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (let runIndex = 0; runIndex < fileGroups.length; runIndex++) {
    lines.push(formatOverviewRow(runIndex, fileGroups[runIndex]));
  }

  lines.push('', '');

  for (let runIndex = 0; runIndex < fileGroups.length; runIndex++) {
    const group = fileGroups[runIndex];
    lines.push(...formatRunSection(runIndex, group, formatName));

    const classGroups = groupTestsByClassWithFailuresFirst(group.tests);
    for (let classIndex = 0; classIndex < classGroups.length; classIndex++) {
      const classGroup = classGroups[classIndex];
      lines.push(
        ...formatClassDetailBlock(
          runIndex,
          classIndex,
          classGroup.qualifiedClassName,
          classGroup.tests,
          formatName,
        ),
      );
    }
  }

  return lines;
}

/** @deprecated Use formatJobSummaryTestTables */
export function formatAllTestsSection(
  tests: TestCase[],
  links: ReportLinks,
  formatName: (test: TestCase) => string = (t) => `\`${t.fullName}\``,
): string[] {
  return formatJobSummaryTestTables(tests, undefined, links, formatName);
}
