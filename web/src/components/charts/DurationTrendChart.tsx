import type { RunSummary } from '@actions-insights/history-models';
import { CHART_COLORS, maxValue } from '../../utils/chart';
import { formatDate, formatDuration } from '../../utils/format';

interface DurationTrendChartProps {
  runs: Pick<RunSummary, 'durationMs' | 'status' | 'runId' | 'date'>[];
  width?: number;
  height?: number;
  onBarClick?: (runId: string) => void;
}

export function DurationTrendChart({ runs, width = 280, height = 140, onBarClick }: DurationTrendChartProps) {
  const points = runs.slice(-20);

  if (points.length === 0) {
    return <p className="chart-empty">No duration data</p>;
  }

  const pad = 24;
  const maxDur = maxValue(points.map((p) => p.durationMs));
  const barW = Math.max(4, (width - pad * 2) / points.length - 4);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Duration trend">
      {points.map((p, i) => {
        const x = pad + i * (barW + 4);
        const barH = Math.max(4, (p.durationMs / maxDur) * (height - pad * 2));
        const base = height - pad;
        const color = p.status === 'failed' ? CHART_COLORS.failed : CHART_COLORS.passed;
        return (
          <rect
            key={p.runId}
            x={x}
            y={base - barH}
            width={barW}
            height={barH}
            fill={color}
            rx={2}
            style={{ cursor: onBarClick ? 'pointer' : undefined }}
            onClick={() => onBarClick?.(p.runId)}
          >
            <title>{`${formatDate(p.date)}: ${formatDuration(p.durationMs)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
