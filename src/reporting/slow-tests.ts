import type { TestCase } from '../model/test-case';
import { formatDuration, outcomeLabel } from '../model/test-run';
import {
  groupTestsByClass,
  groupTestsByClassWithFailuresFirst,
  type TestClassGroup,
} from './grouping';

export const SLOW_VISIBLE = 3;
export const SLOW_COLLAPSED = 15;
export const SLOW_TOTAL = SLOW_VISIBLE + SLOW_COLLAPSED;

export function selectSlowestTests(tests: TestCase[], limit: number): TestCase[] {
  if (limit <= 0) return [];
  const sorted = [...tests].sort((a, b) => b.durationMs - a.durationMs);
  return sorted.slice(0, limit);
}

export function formatSlowTestLine(test: TestCase, slowThresholdMs: number, displayName?: string): string {
  const slow = test.durationMs >= slowThresholdMs ? '⚠ ' : '';
  const name = displayName ?? `\`${test.fullName}\``;
  return `- ${slow}${name} · ${formatDuration(test.durationMs)}`;
}

export function formatSlowTestTableRow(test: TestCase, slowThresholdMs: number): string {
  const slow = test.durationMs >= slowThresholdMs ? '⚠ ' : '';
  return `| ${slow}\`${test.fullName.replace(/\|/g, '\\|')}\` | ${formatDuration(test.durationMs)} | ${outcomeLabel(test.outcome)} |`;
}

export function formatSkippedTestLine(test: TestCase): string {
  const reason = test.message ? ` — ${test.message.split('\n')[0]}` : '';
  return `- \`${test.fullName}\`${reason}`;
}

function renderGroupedSlowLines(
  groups: TestClassGroup[],
  slowThresholdMs: number,
  formatName: (test: TestCase) => string,
): string[] {
  const lines: string[] = [];
  for (const group of groups) {
    lines.push(`### ${group.qualifiedClassName}`);
    for (const test of group.tests) {
      lines.push(formatSlowTestLine(test, slowThresholdMs, formatName(test)));
    }
    lines.push('');
  }
  return lines;
}

export function formatSlowTestsSection(
  slowTests: TestCase[],
  slowThresholdMs: number,
  options: { splitCollapsed?: boolean; formatName?: (test: TestCase) => string },
): string[] {
  if (slowTests.length === 0) return [];

  const formatName = options.formatName ?? ((t) => `\`${t.fullName}\``);
  const lines: string[] = ['## Slowest Tests', ''];

  if (options.splitCollapsed && slowTests.length > SLOW_VISIBLE) {
    const visible = slowTests.slice(0, SLOW_VISIBLE);
    const collapsed = slowTests.slice(SLOW_VISIBLE, SLOW_TOTAL);

    lines.push(...renderGroupedSlowLines(groupTestsByClass(visible), slowThresholdMs, formatName));

    if (collapsed.length > 0) {
      const collapsedLines = renderGroupedSlowLines(
        groupTestsByClass(collapsed),
        slowThresholdMs,
        formatName,
      );
      lines.push(`<details><summary>${collapsed.length} more slow test${collapsed.length === 1 ? '' : 's'}</summary>`);
      lines.push('');
      lines.push(...collapsedLines);
      lines.push('</details>');
      lines.push('');
    }
  } else {
    lines.push(
      ...renderGroupedSlowLines(groupTestsByClass(slowTests), slowThresholdMs, formatName),
    );
  }

  return lines;
}

export function outcomeEmoji(outcome: TestCase['outcome']): string {
  switch (outcome) {
    case 'passed':
      return '✅';
    case 'failed':
      return '❌';
    case 'skipped':
      return '⏭';
    default:
      return '❔';
  }
}

export function formatAllTestLine(test: TestCase, displayName: string): string {
  return `${outcomeEmoji(test.outcome)} ${displayName} · ${formatDuration(test.durationMs)}`;
}

export function classOutcomeCounts(tests: TestCase[]): string {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  for (const test of tests) {
    if (test.outcome === 'passed') passed++;
    else if (test.outcome === 'failed') failed++;
    else if (test.outcome === 'skipped') skipped++;
  }
  const parts: string[] = [];
  if (passed > 0) parts.push(`✅ ${passed}`);
  if (failed > 0) parts.push(`❌ ${failed}`);
  if (skipped > 0) parts.push(`⏭ ${skipped}`);
  return parts.join(' · ');
}
