import { useCallback, useRef, useState } from 'react';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { buildLinearTicks, CHART_COLORS, maxValue } from '../../utils/chart';
import { formatDate, formatDateCompact, formatDuration, statusIcon } from '../../utils/format';

const DURATION_LINE_COLOR = '#1a56db';
const WIDTH = 800;
const HEIGHT = 340;
const PAD = { top: 40, right: 56, bottom: 44, left: 48 };

interface RunTrendsChartProps {
  runs: EnrichedRun[];
  singleBranchView?: boolean;
  onRunClick?: (run: EnrichedRun) => void;
}

interface TooltipState {
  run: EnrichedRun;
  x: number;
  y: number;
}

export function RunTrendsChart({
  runs,
  singleBranchView = false,
  onRunClick,
}: RunTrendsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredRunId, setHoveredRunId] = useState<string | null>(null);

  const showTooltip = useCallback((run: EnrichedRun, target: SVGRectElement | SVGCircleElement) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const x = targetRect.left - containerRect.left + targetRect.width / 2;
    const y = targetRect.top - containerRect.top;
    setTooltip({ run, x, y });
    setHoveredRunId(run.runId);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
    setHoveredRunId(null);
  }, []);

  if (runs.length === 0) {
    return <p className="chart-empty">No run history yet</p>;
  }

  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;
  const maxTests = maxValue(runs.map((r) => r.total));
  const maxDuration = maxValue(runs.map((r) => r.durationMs));
  const leftTicks = buildLinearTicks(maxTests, 4);
  const rightTicks = buildLinearTicks(maxDuration, 4);
  const slotWidth = chartWidth / runs.length;
  const barWidth = Math.min(32, Math.max(4, slotWidth - 6));
  const labelStep = runs.length > 15 ? Math.ceil(runs.length / 15) : 1;

  const xCenter = (index: number) => PAD.left + slotWidth * index + slotWidth / 2;
  const yForTests = (total: number) => PAD.top + chartHeight - (total / maxTests) * chartHeight;
  const yForDuration = (durationMs: number) =>
    PAD.top + chartHeight - (durationMs / maxDuration) * chartHeight;

  const linePoints = runs
    .map((run, i) => `${xCenter(i)},${yForDuration(run.durationMs)}`)
    .join(' ');

  return (
    <div ref={containerRef} className="run-trends-chart">
      <div className="run-trends-legend">
        <span className="run-trends-legend-item">
          <span className="run-trends-swatch passed" aria-hidden="true" />
          Tests (pass)
        </span>
        <span className="run-trends-legend-item">
          <span className="run-trends-swatch failed" aria-hidden="true" />
          Tests (fail)
        </span>
        <span className="run-trends-legend-item">
          <span className="run-trends-swatch line" aria-hidden="true" />
          Duration
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="run-trends-svg"
        role="img"
        aria-label="Test count bars and duration line per run"
      >
        {leftTicks.map((tick) => {
          const y = yForTests(tick);
          return (
            <g key={`left-${tick}`}>
              <line
                x1={PAD.left}
                y1={y}
                x2={WIDTH - PAD.right}
                y2={y}
                className="run-trends-grid-line"
              />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="run-trends-axis-label">
                {tick}
              </text>
            </g>
          );
        })}

        {rightTicks.map((tick) => {
          const y = yForDuration(tick);
          return (
            <text
              key={`right-${tick}`}
              x={WIDTH - PAD.right + 8}
              y={y + 4}
              textAnchor="start"
              className="run-trends-axis-label"
            >
              {formatDuration(tick)}
            </text>
          );
        })}

        <text
          x={PAD.left - 32}
          y={PAD.top + chartHeight / 2}
          textAnchor="middle"
          className="run-trends-axis-title"
          transform={`rotate(-90, ${PAD.left - 32}, ${PAD.top + chartHeight / 2})`}
        >
          Tests
        </text>
        <text
          x={WIDTH - PAD.right + 40}
          y={PAD.top + chartHeight / 2}
          textAnchor="middle"
          className="run-trends-axis-title"
          transform={`rotate(90, ${WIDTH - PAD.right + 40}, ${PAD.top + chartHeight / 2})`}
        >
          Duration
        </text>

        <line
          x1={PAD.left}
          y1={PAD.top + chartHeight}
          x2={WIDTH - PAD.right}
          y2={PAD.top + chartHeight}
          className="run-trends-axis-line"
        />

        <polyline
          points={linePoints}
          fill="none"
          stroke={DURATION_LINE_COLOR}
          strokeWidth={2}
          className="run-trends-duration-line"
        />

        {runs.map((run, i) => {
          const cx = xCenter(i);
          const barH = Math.max(2, (run.total / maxTests) * chartHeight);
          const barY = PAD.top + chartHeight - barH;
          const color = run.status === 'passed' ? CHART_COLORS.passed : CHART_COLORS.failed;
          const isHovered = hoveredRunId === run.runId;
          const showLabel = i % labelStep === 0 || i === runs.length - 1;

          return (
            <g key={run.runId}>
              <rect
                x={cx - barWidth / 2}
                y={barY}
                width={barWidth}
                height={barH}
                fill={color}
                rx={2}
                className={`run-trends-bar${isHovered ? ' hovered' : ''}${onRunClick ? ' clickable' : ''}`}
                onMouseEnter={(e) => showTooltip(run, e.currentTarget)}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(run, e.currentTarget)}
                onBlur={hideTooltip}
                onClick={() => onRunClick?.(run)}
                tabIndex={onRunClick ? 0 : undefined}
                role={onRunClick ? 'button' : undefined}
                aria-label={
                  onRunClick
                    ? `${formatDateCompact(run.date)}, ${run.total} tests, ${formatDuration(run.durationMs)}, ${run.status}`
                    : undefined
                }
              />
              <circle
                cx={cx}
                cy={yForDuration(run.durationMs)}
                r={3}
                fill={DURATION_LINE_COLOR}
                className={`run-trends-point${isHovered ? ' hovered' : ''}`}
                onMouseEnter={(e) => showTooltip(run, e.currentTarget)}
                onMouseLeave={hideTooltip}
              />
              {showLabel && (
                <text
                  x={cx}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="run-trends-date-label"
                >
                  {formatDateCompact(run.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="duration-trend-tooltip"
          role="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="duration-trend-tooltip-status">
            {statusIcon(tooltip.run.status)} {tooltip.run.status}
          </div>
          <div className="duration-trend-tooltip-row">
            <span className="duration-trend-tooltip-label">Tests</span>
            <span>
              {tooltip.run.total} total
              {' · '}
              <span className="passed-text">{tooltip.run.passed} passed</span>
              {' · '}
              <span className="failed-text">{tooltip.run.failed} failed</span>
            </span>
          </div>
          <div className="duration-trend-tooltip-row">
            <span className="duration-trend-tooltip-label">Duration</span>
            <span>{formatDuration(tooltip.run.durationMs)}</span>
          </div>
          <div className="duration-trend-tooltip-row">
            <span className="duration-trend-tooltip-label">Build</span>
            <span className="mono">#{tooltip.run.workflowRunId}</span>
          </div>
          {!singleBranchView && (
            <div className="duration-trend-tooltip-row">
              <span className="duration-trend-tooltip-label">Branch/PR</span>
              <span>{tooltip.run.branchLabel}</span>
            </div>
          )}
          <div className="duration-trend-tooltip-row">
            <span className="duration-trend-tooltip-label">Date</span>
            <span>{formatDate(tooltip.run.date)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
