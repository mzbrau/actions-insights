import type { CoverageMetrics } from '../model/coverage';

export function formatCoveragePercent(value: number | undefined): string {
  if (value === undefined) return '—';
  return `${value.toFixed(1)}%`;
}

export function computeCoverageDelta(
  current: CoverageMetrics | undefined,
  previous: CoverageMetrics | undefined,
): { line?: number; branch?: number } {
  if (!current || !previous) return {};
  const delta: { line?: number; branch?: number } = {};
  if (typeof current.line === 'number' && typeof previous.line === 'number') {
    delta.line = Math.round((current.line - previous.line) * 10) / 10;
  }
  if (typeof current.branch === 'number' && typeof previous.branch === 'number') {
    delta.branch = Math.round((current.branch - previous.branch) * 10) / 10;
  }
  return delta;
}

export function formatCoverageDeltaValue(delta: number | undefined): string {
  if (delta === undefined) return '';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

export function formatCoverageCompactLine(
  summary: CoverageMetrics | undefined,
  delta?: { line?: number; branch?: number },
  vsLabel?: string,
): string | undefined {
  if (!summary || summary.line === undefined) return undefined;
  const parts = [`📊 **Coverage:** ${formatCoveragePercent(summary.line)} lines`];
  if (delta && vsLabel && delta.line !== undefined) {
    parts.push(`(${formatCoverageDeltaValue(delta.line)} vs ${vsLabel})`);
  }
  return parts.join(' ');
}

export function formatCoverageStatsTable(
  summary: CoverageMetrics,
  projects?: Record<string, CoverageMetrics>,
): string {
  const lines = ['| Metric | Value |', '| --- | --- |'];
  if (summary.line !== undefined) lines.push(`| Line coverage | ${formatCoveragePercent(summary.line)} |`);
  if (summary.method !== undefined) lines.push(`| Method coverage | ${formatCoveragePercent(summary.method)} |`);
  if (summary.coveredLines !== undefined && summary.totalLines !== undefined) {
    lines.push(`| Lines | ${summary.coveredLines} / ${summary.totalLines} |`);
  }

  if (projects && Object.keys(projects).length > 0) {
    lines.push('', '**By project**', '', '| Project | Line |', '| --- | --- |');
    for (const [name, metrics] of Object.entries(projects).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`| ${name} | ${formatCoveragePercent(metrics.line)} |`);
    }
  }

  return lines.join('\n');
}
