import type { TestRun } from '../model/test-run';

export function formatStatusReasonLine(run: TestRun): string | undefined {
  if (run.status !== 'failed' || run.stats.total > 0 || !run.statusReason) {
    return undefined;
  }
  return run.statusReason;
}

export function buildCheckTitle(run: TestRun): string {
  if (run.status === 'failed' && run.stats.failed === 0 && run.statusReason) {
    return run.statusReason;
  }
  return `${run.stats.passed.toLocaleString()} passed, ${run.stats.failed.toLocaleString()} failed`;
}
