import { CODE_TO_OUTCOME, type RunStatus } from '@actions-insights/history-models';

export function statusIcon(status: RunStatus): string {
  return status === 'passed' ? '✅' : '❌';
}

export function outcomeIcon(code: number): string {
  const outcome = CODE_TO_OUTCOME[code] ?? 'inconclusive';
  switch (outcome) {
    case 'passed':
      return '✅';
    case 'failed':
      return '❌';
    case 'skipped':
      return '⏭';
    default:
      return '❓';
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatDateCompact(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function shortTestName(fullName: string): string {
  const lastDot = fullName.lastIndexOf('.');
  return lastDot >= 0 ? fullName.slice(lastDot + 1) : fullName;
}

export function passRate(passed: number, total: number): number {
  return total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;
}
