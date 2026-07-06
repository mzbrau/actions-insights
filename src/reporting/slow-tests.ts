import type { TestCase } from '../model/test-case';
import { formatDuration, outcomeLabel } from '../model/test-run';

export function selectSlowestTests(tests: TestCase[], limit: number): TestCase[] {
  if (limit <= 0) return [];
  const sorted = [...tests].sort((a, b) => b.durationMs - a.durationMs);
  return sorted.slice(0, limit);
}

export function formatSlowTestLine(test: TestCase, slowThresholdMs: number): string {
  const slow = test.durationMs >= slowThresholdMs ? '⚠ ' : '';
  return `${slow}\`${test.fullName}\` · ${formatDuration(test.durationMs)}`;
}

export function formatSlowTestTableRow(test: TestCase, slowThresholdMs: number): string {
  const slow = test.durationMs >= slowThresholdMs ? '⚠ ' : '';
  return `| ${slow}\`${test.fullName.replace(/\|/g, '\\|')}\` | ${formatDuration(test.durationMs)} | ${outcomeLabel(test.outcome)} |`;
}

export function formatSkippedTestLine(test: TestCase): string {
  const reason = test.message ? ` — ${test.message.split('\n')[0]}` : '';
  return `- \`${test.fullName}\`${reason}`;
}
