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
  if (summary.branch !== undefined) {
    parts[0] += ` · ${formatCoveragePercent(summary.branch)} branches`;
  }
  if (delta && vsLabel) {
    const deltaParts: string[] = [];
    if (delta.line !== undefined) deltaParts.push(formatCoverageDeltaValue(delta.line));
    if (delta.branch !== undefined) deltaParts.push(formatCoverageDeltaValue(delta.branch));
    if (deltaParts.length > 0) {
      parts.push(`(${deltaParts.join(' / ')} vs ${vsLabel})`);
    }
  }
  return parts.join(' ');
}

export function formatCoverageStatsTable(
  summary: CoverageMetrics,
  projects?: Record<string, CoverageMetrics>,
): string {
  const lines = ['| Metric | Value |', '| --- | --- |'];
  if (summary.line !== undefined) lines.push(`| Line coverage | ${formatCoveragePercent(summary.line)} |`);
  if (summary.branch !== undefined) lines.push(`| Branch coverage | ${formatCoveragePercent(summary.branch)} |`);
  if (summary.method !== undefined) lines.push(`| Method coverage | ${formatCoveragePercent(summary.method)} |`);
  if (summary.coveredLines !== undefined && summary.totalLines !== undefined) {
    lines.push(`| Lines | ${summary.coveredLines} / ${summary.totalLines} |`);
  }
  if (summary.coveredBranches !== undefined && summary.totalBranches !== undefined) {
    lines.push(`| Branches | ${summary.coveredBranches} / ${summary.totalBranches} |`);
  }

  if (projects && Object.keys(projects).length > 0) {
    lines.push('', '**By project**', '', '| Project | Line | Branch |', '| --- | --- | --- |');
    for (const [name, metrics] of Object.entries(projects).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(
        `| ${name} | ${formatCoveragePercent(metrics.line)} | ${formatCoveragePercent(metrics.branch)} |`,
      );
    }
  }

  return lines.join('\n');
}
