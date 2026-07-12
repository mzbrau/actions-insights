import { useCallback, useRef, useState } from 'react';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { buildLinearTicks, CHART_COLORS, maxValue } from '../../utils/chart';
import { formatDate, formatDateCompact, formatDuration } from '../../utils/format';

const WIDTH = 800;
const HEIGHT = 340;
const PAD = { top: 40, right: 24, bottom: 44, left: 48 };

export interface WorkflowDurationPoint {
  runId: string;
  date: string;
  branchLabel: string;
  commitShortSha: string;
  workflowDurationMs: number;
}

interface WorkflowDurationTrendChartProps {
  points: WorkflowDurationPoint[];
  onPointClick?: (runId: string) => void;
}

interface TooltipState {
  point: WorkflowDurationPoint;
  x: number;
  y: number;
}

export function WorkflowDurationTrendChart({
  points,
  onPointClick,
}: WorkflowDurationTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const chartPoints = points.filter((p) => p.workflowDurationMs !== undefined);

  const showTooltip = useCallback((
    point: WorkflowDurationPoint,
    target: SVGCircleElement,
  ) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setTooltip({
      point,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top,
    });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  if (chartPoints.length === 0) {
    return <p className="chart-empty">No workflow timing data</p>;
  }

  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;
  const maxMs = maxValue(chartPoints.map((p) => p.workflowDurationMs));
  const yTicks = buildLinearTicks(maxMs, 4);
  const slotWidth = chartWidth / chartPoints.length;
  const labelStep = chartPoints.length > 15 ? Math.ceil(chartPoints.length / 15) : 1;

  const xCenter = (index: number) => PAD.left + slotWidth * index + slotWidth / 2;
  const yForDuration = (durationMs: number) =>
    PAD.top + chartHeight - (durationMs / maxMs) * chartHeight;

  const linePoints = chartPoints
    .map((point, index) => `${xCenter(index)},${yForDuration(point.workflowDurationMs)}`)
    .join(' ');

  return (
    <div ref={containerRef} className="coverage-trend-chart workflow-duration-line-chart">
      <div className="coverage-trend-legend" aria-label="Workflow duration">
        <span className="coverage-trend-legend-item">
          <span
            className="coverage-trend-swatch"
            style={{ background: CHART_COLORS.info }}
            aria-hidden="true"
          />
          Workflow run
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="coverage-trend-svg"
        role="img"
        aria-label="Workflow duration by run"
      >
        {yTicks.map((tick) => {
          const y = yForDuration(tick);
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
                {formatDuration(tick)}
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
          Duration
        </text>

        <line
          x1={PAD.left}
          y1={PAD.top + chartHeight}
          x2={WIDTH - PAD.right}
          y2={PAD.top + chartHeight}
          className="coverage-trend-axis-line"
        />

        <polyline
          points={linePoints}
          fill="none"
          stroke={CHART_COLORS.info}
          strokeWidth={2}
          className="coverage-trend-line"
        />

        {chartPoints.map((point, index) => {
          const cx = xCenter(index);
          const cy = yForDuration(point.workflowDurationMs);
          return (
            <circle
              key={point.runId}
              cx={cx}
              cy={cy}
              r={4}
              fill={CHART_COLORS.info}
              className={`coverage-trend-point${onPointClick ? ' clickable' : ''}`}
              onMouseEnter={(e) => showTooltip(point, e.currentTarget)}
              onMouseLeave={hideTooltip}
              onFocus={(e) => showTooltip(point, e.currentTarget)}
              onBlur={hideTooltip}
              onClick={() => onPointClick?.(point.runId)}
              tabIndex={onPointClick ? 0 : undefined}
              role={onPointClick ? 'button' : undefined}
              aria-label={`Workflow run: ${formatDuration(point.workflowDurationMs)} on ${formatDateCompact(point.date)}`}
            />
          );
        })}

        {chartPoints.map((point, index) => {
          const showLabel = index % labelStep === 0 || index === chartPoints.length - 1;
          if (!showLabel) return null;
          return (
            <text
              key={`label-${point.runId}`}
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
          <div><strong>Run {tooltip.point.runId}</strong></div>
          <div>Workflow: {formatDuration(tooltip.point.workflowDurationMs)}</div>
          <div>{formatDate(tooltip.point.date)}</div>
          <div>{tooltip.point.branchLabel} · {tooltip.point.commitShortSha}</div>
        </div>
      )}
    </div>
  );
}

export function runsToWorkflowDurationPoints(runs: EnrichedRun[]): WorkflowDurationPoint[] {
  return runs
    .filter((run) => run.timing?.workflowDurationMs !== undefined)
    .map((run) => ({
      runId: run.runId,
      date: run.date,
      branchLabel: run.branchLabel,
      commitShortSha: run.commitShortSha,
      workflowDurationMs: run.timing!.workflowDurationMs!,
    }));
}
