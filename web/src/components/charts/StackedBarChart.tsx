import type { RunSummary } from '@actions-insights/history-models';
import { CHART_COLORS, maxValue } from '../../utils/chart';

interface StackedBarChartProps {
  runs: Pick<RunSummary, 'passed' | 'failed' | 'runId'>[];
  width?: number;
  height?: number;
}

export function StackedBarChart({ runs, width = 280, height = 140 }: StackedBarChartProps) {
  const points = runs.slice(-20);

  if (points.length === 0) {
    return <p className="chart-empty">No run history yet</p>;
  }

  const pad = 24;
  const maxVal = maxValue(points.map((p) => p.passed + p.failed));
  const barW = Math.max(4, (width - pad * 2) / points.length - 4);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Pass and fail counts per run">
      {points.map((p, i) => {
        const x = pad + i * (barW + 4);
        const passH = (p.passed / maxVal) * (height - pad * 2);
        const failH = (p.failed / maxVal) * (height - pad * 2);
        const base = height - pad;
        return (
          <g key={p.runId}>
            <rect x={x} y={base - passH - failH} width={barW} height={failH} fill={CHART_COLORS.failed} rx={2} />
            <rect x={x} y={base - passH} width={barW} height={passH} fill={CHART_COLORS.passed} rx={2} />
          </g>
        );
      })}
    </svg>
  );
}
