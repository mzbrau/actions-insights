import type { TestRun } from '../model/test-run';
import { GITHUB_CHECK_TITLE_MAX_CHARS } from '../github/limits';

export function formatStatusReasonLine(run: TestRun): string | undefined {
  if (run.status !== 'failed' || run.stats.total > 0 || !run.statusReason) {
    return undefined;
  }
  return run.statusReason;
}

function normalizeCheckTitle(title: string): string {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (normalized.length <= GITHUB_CHECK_TITLE_MAX_CHARS) return normalized;
  return `${normalized.slice(0, GITHUB_CHECK_TITLE_MAX_CHARS - 1)}…`;
}

export function buildCheckTitle(run: TestRun): string {
  if (run.status === 'failed' && run.stats.failed === 0 && run.statusReason) {
    return normalizeCheckTitle(run.statusReason);
  }
  return normalizeCheckTitle(
    `${run.stats.passed.toLocaleString()} passed, ${run.stats.failed.toLocaleString()} failed`,
  );
}
