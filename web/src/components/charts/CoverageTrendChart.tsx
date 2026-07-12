import { useCallback, useMemo, useRef, useState } from 'react';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { COVERAGE_SERIES_COLORS } from '../../utils/chart';
import { formatCoverageDisplayName, formatDate, formatDateCompact } from '../../utils/format';

const OVERALL_SERIES_ID = '__overall__';
const WIDTH = 800;
const HEIGHT = 340;
const PAD = { top: 40, right: 24, bottom: 44, left: 48 };
const Y_MAX = 100;
const Y_TICKS = [0, 25, 50, 75, 100];

export interface CoverageSeriesPoint {
  runId: string;
  date: string;
  branchLabel: string;
  commitShortSha: string;
  value?: number;
}

export interface CoverageSeries {
  id: string;
  label: string;
  rawLabel: string;
  color: string;
  strokeWidth: number;
  points: CoverageSeriesPoint[];
}

interface CoverageTrendChartProps {
  runs: EnrichedRun[];
  onPointClick?: (runId: string) => void;
}

interface TooltipState {
  seriesLabel: string;
  value: number;
  date: string;
  branchLabel: string;
  commitShortSha: string;
  x: number;
  y: number;
}

export function collectProjectNames(runs: EnrichedRun[]): string[] {
  const names = new Set<string>();
  for (const run of runs) {
    if (run.coverage?.projects) {
      for (const name of Object.keys(run.coverage.projects)) {
        names.add(name);
      }
    }
  }
  return [...names].sort();
}

export function buildCoverageSeries(runs: EnrichedRun[]): {
  builds: EnrichedRun[];
  series: CoverageSeries[];
} {
  const builds = runs.filter((run) => run.coverage?.line !== undefined);
  const projectNames = collectProjectNames(builds);

  const overall: CoverageSeries = {
    id: OVERALL_SERIES_ID,
    label: 'Application coverage',
    rawLabel: 'Application coverage',
    color: COVERAGE_SERIES_COLORS[0],
    strokeWidth: 3.5,
    points: builds.map((run) => ({
      runId: run.runId,
      date: run.date,
      branchLabel: run.branchLabel,
      commitShortSha: run.commitShortSha,
      value: run.coverage?.line,
    })),
  };

  const projectSeries: CoverageSeries[] = projectNames.map((name, index) => ({
    id: name,
    label: formatCoverageDisplayName(name),
    rawLabel: name,
    color: COVERAGE_SERIES_COLORS[(index + 1) % COVERAGE_SERIES_COLORS.length],
    strokeWidth: 1.5,
    points: builds.map((run) => ({
      runId: run.runId,
      date: run.date,
      branchLabel: run.branchLabel,
      commitShortSha: run.commitShortSha,
      value: run.coverage?.projects?.[name]?.line,
    })),
  }));

  return { builds, series: [overall, ...projectSeries] };
}

function splitSegments(
  points: CoverageSeriesPoint[],
  xAt: (index: number) => number,
  yAt: (value: number) => number,
): string[] {
  const segments: string[] = [];
  let current: string[] = [];

  points.forEach((point, index) => {
    if (point.value === undefined) {
      if (current.length > 0) {
        segments.push(current.join(' '));
        current = [];
      }
      return;
    }
    current.push(`${xAt(index)},${yAt(point.value)}`);
  });

  if (current.length > 0) segments.push(current.join(' '));
  return segments;
}

export function CoverageTrendChart({ runs, onPointClick }: CoverageTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const { builds, series } = useMemo(() => buildCoverageSeries(runs), [runs]);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set());

  const isVisible = useCallback((seriesId: string) => !hiddenSeries.has(seriesId), [hiddenSeries]);

  const toggleSeries = useCallback((seriesId: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) next.delete(seriesId);
      else next.add(seriesId);
      return next;
    });
  }, []);

  const showTooltip = useCallback((
    point: CoverageSeriesPoint,
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
      date: point.date,
      branchLabel: point.branchLabel,
      commitShortSha: point.commitShortSha,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top,
    });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  if (builds.length === 0) {
    return <p className="chart-empty">No coverage data</p>;
  }

  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;
  const slotWidth = chartWidth / builds.length;
  const labelStep = builds.length > 15 ? Math.ceil(builds.length / 15) : 1;

  const xCenter = (index: number) => PAD.left + slotWidth * index + slotWidth / 2;
  const yForCoverage = (value: number) =>
    PAD.top + chartHeight - (value / Y_MAX) * chartHeight;

  return (
    <div ref={containerRef} className="coverage-trend-chart">
      <div className="coverage-trend-legend" aria-label="Coverage series">
        {series.map((s) => {
          const visible = isVisible(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className={`coverage-trend-legend-item${visible ? '' : ' is-hidden'}`}
              aria-pressed={visible}
              title={s.rawLabel}
              onClick={() => toggleSeries(s.id)}
            >
              <span
                className="coverage-trend-swatch"
                style={{ background: s.color }}
                aria-hidden="true"
              />
              {s.label}
            </button>
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="coverage-trend-svg"
        role="img"
        aria-label="Line coverage by build"
      >
        {Y_TICKS.map((tick) => {
          const y = yForCoverage(tick);
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
                {tick}%
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
          Coverage %
        </text>

        <line
          x1={PAD.left}
          y1={PAD.top + chartHeight}
          x2={WIDTH - PAD.right}
          y2={PAD.top + chartHeight}
          className="coverage-trend-axis-line"
        />

        {series.filter((s) => isVisible(s.id)).map((s) =>
          splitSegments(s.points, xCenter, yForCoverage).map((segmentPoints, segIndex) => (
            <polyline
              key={`${s.id}-${segIndex}`}
              points={segmentPoints}
              fill="none"
              stroke={s.color}
              strokeWidth={s.strokeWidth}
              className={`coverage-trend-line${s.id === OVERALL_SERIES_ID ? ' coverage-trend-line--overall' : ''}`}
            />
          )),
        )}

        {series.filter((s) => isVisible(s.id)).flatMap((s) =>
          s.points.map((point, index) => {
            if (point.value === undefined) return null;
            const cx = xCenter(index);
            const cy = yForCoverage(point.value);
            return (
              <circle
                key={`${s.id}-${point.runId}`}
                cx={cx}
                cy={cy}
                r={s.id === OVERALL_SERIES_ID ? 4 : 3}
                fill={s.color}
                className={`coverage-trend-point${onPointClick ? ' clickable' : ''}`}
                onMouseEnter={(e) => showTooltip(point, s.label, point.value!, e.currentTarget)}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(point, s.label, point.value!, e.currentTarget)}
                onBlur={hideTooltip}
                onClick={() => onPointClick?.(point.runId)}
                tabIndex={onPointClick ? 0 : undefined}
                role={onPointClick ? 'button' : undefined}
                aria-label={`${s.label}: ${point.value!.toFixed(1)}% on ${formatDateCompact(point.date)}`}
              />
            );
          }),
        )}

        {builds.map((run, index) => {
          const showLabel = index % labelStep === 0 || index === builds.length - 1;
          if (!showLabel) return null;
          return (
            <text
              key={run.runId}
              x={xCenter(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="coverage-trend-date-label"
            >
              {formatDateCompact(run.date)}
            </text>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="duration-trend-tooltip coverage-trend-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          role="tooltip"
        >
          <div><strong>{tooltip.seriesLabel}</strong></div>
          <div>{tooltip.value.toFixed(1)}% line coverage</div>
          <div>{formatDate(tooltip.date)}</div>
          <div>{tooltip.branchLabel} · {tooltip.commitShortSha}</div>
        </div>
      )}
    </div>
  );
}
