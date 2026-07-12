import { useCallback, useRef, useState } from 'react';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { buildLinearTicks, CHART_COLORS, maxValue } from '../../utils/chart';
import { formatDate, formatDateCompact } from '../../utils/format';

const WIDTH = 800;
const HEIGHT = 340;
const PAD = { top: 40, right: 24, bottom: 44, left: 48 };

const SERIES = [
  { id: 'errors', label: 'Errors', color: CHART_COLORS.failed, accessor: (p: DiagnosticsTrendPoint) => p.errors },
  { id: 'warnings', label: 'Warnings', color: CHART_COLORS.skipped, accessor: (p: DiagnosticsTrendPoint) => p.warnings },
] as const;

export interface DiagnosticsTrendPoint {
  runId: string;
  date: string;
  branchLabel: string;
  commitShortSha: string;
  errors: number;
  warnings: number;
}

interface DiagnosticsTrendChartProps {
  points: DiagnosticsTrendPoint[];
  onPointClick?: (runId: string) => void;
}

interface TooltipState {
  seriesLabel: string;
  value: number;
  point: DiagnosticsTrendPoint;
  x: number;
  y: number;
}

export function DiagnosticsTrendChart({ points, onPointClick }: DiagnosticsTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = useCallback((
    point: DiagnosticsTrendPoint,
    seriesLabel: string,
    value: number,
    target: SVGCircleElement,
  ) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setTooltip({
      seriesLabel,
      value,
      point,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top,
    });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  if (points.length === 0) {
    return <p className="chart-empty">No diagnostic data</p>;
  }

  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;
  const maxCount = maxValue(points.map((p) => Math.max(p.errors, p.warnings)));
  const yTicks = buildLinearTicks(maxCount, 4);
  const slotWidth = chartWidth / points.length;
  const labelStep = points.length > 15 ? Math.ceil(points.length / 15) : 1;

  const xCenter = (index: number) => PAD.left + slotWidth * index + slotWidth / 2;
  const yForCount = (value: number) =>
    PAD.top + chartHeight - (value / maxCount) * chartHeight;

  return (
    <div ref={containerRef} className="coverage-trend-chart diagnostics-line-chart">
      <div className="coverage-trend-legend" aria-label="Diagnostic series">
        {SERIES.map((s) => (
          <span key={s.id} className="coverage-trend-legend-item">
            <span
              className="coverage-trend-swatch"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="coverage-trend-svg"
        role="img"
        aria-label="Build diagnostics errors and warnings by run"
      >
        {yTicks.map((tick) => {
          const y = yForCount(tick);
          return (
            <g key={`y-${tick}`}>
              <line
                x1={PAD.left}
                y1={y}
                x2={WIDTH - PAD.right}
                y2={y}
                className="coverage-trend-grid-line"
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                className="coverage-trend-axis-label"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <text
          x={PAD.left - 36}
          y={PAD.top + chartHeight / 2}
          textAnchor="middle"
          className="coverage-trend-axis-title"
          transform={`rotate(-90, ${PAD.left - 36}, ${PAD.top + chartHeight / 2})`}
        >
          Count
        </text>

        <line
          x1={PAD.left}
          y1={PAD.top + chartHeight}
          x2={WIDTH - PAD.right}
          y2={PAD.top + chartHeight}
          className="coverage-trend-axis-line"
        />

        {SERIES.map((s) => {
          const linePoints = points
            .map((point, index) => `${xCenter(index)},${yForCount(s.accessor(point))}`)
            .join(' ');
          return (
            <polyline
              key={s.id}
              points={linePoints}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              className="coverage-trend-line"
            />
          );
        })}

        {SERIES.flatMap((s) =>
          points.map((point, index) => {
            const value = s.accessor(point);
            const cx = xCenter(index);
            const cy = yForCount(value);
            return (
              <circle
                key={`${s.id}-${point.runId}`}
                cx={cx}
                cy={cy}
                r={3}
                fill={s.color}
                className={`coverage-trend-point${onPointClick ? ' clickable' : ''}`}
                onMouseEnter={(e) => showTooltip(point, s.label, value, e.currentTarget)}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(point, s.label, value, e.currentTarget)}
                onBlur={hideTooltip}
                onClick={() => onPointClick?.(point.runId)}
                tabIndex={onPointClick ? 0 : undefined}
                role={onPointClick ? 'button' : undefined}
                aria-label={`${s.label}: ${value} on ${formatDateCompact(point.date)}`}
              />
            );
          }),
        )}

        {points.map((point, index) => {
          const showLabel = index % labelStep === 0 || index === points.length - 1;
          if (!showLabel) return null;
          return (
            <text
              key={point.runId}
              x={xCenter(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="coverage-trend-date-label"
            >
              {formatDateCompact(point.date)}
            </text>
          );
        })}

        <text
          x={PAD.left + chartWidth / 2}
          y={HEIGHT - 24}
          textAnchor="middle"
          className="coverage-trend-axis-title"
        >
          Run date
        </text>
      </svg>

      {tooltip && (
        <div
          className="duration-trend-tooltip coverage-trend-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          role="tooltip"
        >
          <div><strong>{tooltip.seriesLabel}</strong></div>
          <div>{tooltip.value}</div>
          <div>{formatDate(tooltip.point.date)}</div>
          <div>{tooltip.point.branchLabel} · {tooltip.point.commitShortSha}</div>
          <div>Errors: {tooltip.point.errors}</div>
          <div>Warnings: {tooltip.point.warnings}</div>
        </div>
      )}
    </div>
  );
}

export function runsToDiagnosticsPoints(runs: EnrichedRun[]): DiagnosticsTrendPoint[] {
  return runs
    .filter((run) => run.diagnostics !== undefined)
    .map((run) => ({
      runId: run.runId,
      date: run.date,
      branchLabel: run.branchLabel,
      commitShortSha: run.commitShortSha,
      errors: run.diagnostics?.errors ?? 0,
      warnings: run.diagnostics?.warnings ?? 0,
    }));
}
