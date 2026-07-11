export const CHART_COLORS = {
  passed: '#0a6e31',
  failed: '#ba1a1a',
  skipped: '#727785',
  inconclusive: '#913900',
  info: '#2563eb',
} as const;

export interface ChartPoint {
  passed: number;
  failed: number;
  skipped?: number;
  inconclusive?: number;
  durationMs?: number;
  status?: string;
  runId?: string;
  label?: string;
}

export function maxValue(values: number[], fallback = 1): number {
  const max = Math.max(...values, 0);
  return max > 0 ? max : fallback;
}

export function buildLinearTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(Math.round((max / count) * i));
  }
  return [...new Set(ticks)];
}

export function buildDonutSegments(stats: {
  passed: number;
  failed: number;
  skipped: number;
  inconclusive?: number;
}): Array<{ value: number; color: string; label: string }> {
  const inconclusive = stats.inconclusive ?? 0;
  return [
    { value: stats.passed, color: CHART_COLORS.passed, label: 'Passed' },
    { value: stats.failed, color: CHART_COLORS.failed, label: 'Failed' },
    { value: stats.skipped, color: CHART_COLORS.skipped, label: 'Skipped' },
    { value: inconclusive, color: CHART_COLORS.inconclusive, label: 'Inconclusive' },
  ].filter((s) => s.value > 0);
}

export function donutPaths(
  segments: Array<{ value: number; color: string }>,
  cx: number,
  cy: number,
  r: number,
): string {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return '';
  let offset = 0;
  return segments
    .map(({ value, color }) => {
      const pct = value / total;
      const angle = pct * 2 * Math.PI;
      const x1 = cx + r * Math.sin(offset);
      const y1 = cy - r * Math.cos(offset);
      offset += angle;
      const x2 = cx + r * Math.sin(offset);
      const y2 = cy - r * Math.cos(offset);
      const large = angle > Math.PI ? 1 : 0;
      return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${color}"/>`;
    })
    .join('');
}
