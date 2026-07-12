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

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (abs < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  const diffDay = Math.round(diffSec / 86400);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  const diffMonth = Math.round(diffSec / 2592000);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
  return rtf.format(Math.round(diffSec / 31536000), 'year');
}

export function formatDateWithRelative(iso: string, now = Date.now()): string {
  return `${formatDate(iso)} (${formatRelativeTime(iso, now)})`;
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

export function formatCoverageDisplayName(name: string): string {
  if (name.includes('.')) return shortTestName(name);
  const lastSlash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
  return lastSlash >= 0 ? name.slice(lastSlash + 1) : name;
}

export function passRate(passed: number, total: number): number {
  return total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;
}
