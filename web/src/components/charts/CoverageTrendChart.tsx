import { useCallback, useRef, useState } from 'react';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { CHART_COLORS, maxValue } from '../../utils/chart';
import { formatDate, formatDateCompact } from '../../utils/format';

export interface CoverageTrendPoint {
  runId: string;
  date: string;
  branchLabel: string;
  commitShortSha: string;
  line?: number;
  branch?: number;
  coveredLines?: number;
  totalLines?: number;
}

interface CoverageTrendChartProps {
  title?: string;
  points: CoverageTrendPoint[];
  metric?: 'line' | 'branch';
  onBarClick?: (runId: string) => void;
}

interface TooltipState {
  point: CoverageTrendPoint;
  x: number;
  y: number;
}

export function CoverageTrendChart({
  points,
  metric = 'line',
  onBarClick,
}: CoverageTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const values = points.map((p) => (metric === 'line' ? p.line : p.branch)).filter((v): v is number => v !== undefined);
  const chartPoints = points.filter((p) => (metric === 'line' ? p.line : p.branch) !== undefined);

  const showTooltip = useCallback((point: CoverageTrendPoint, target: HTMLElement) => {
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

  if (chartPoints.length === 0) {
    return <p className="chart-empty">No coverage data</p>;
  }

  const maxPct = maxValue(values.length > 0 ? values : [100]);

  return (
    <div ref={containerRef} className="duration-trend-chart coverage-trend-chart">
      <div className="duration-trend-bar-area">
        {chartPoints.map((point) => {
          const value = metric === 'line' ? point.line! : point.branch!;
          const pct = Math.max(4, (value / maxPct) * 100);
          return (
            <button
              key={point.runId}
              type="button"
              className="duration-trend-bar-col coverage-trend-bar-col"
              onMouseEnter={(e) => showTooltip(point, e.currentTarget)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => showTooltip(point, e.currentTarget)}
              onBlur={() => setTooltip(null)}
              onClick={() => onBarClick?.(point.runId)}
              aria-label={`Run ${point.runId}: ${value.toFixed(1)}% ${metric} coverage`}
            >
              <div
                className="duration-trend-bar coverage-trend-bar"
                style={{ height: `${pct}%`, backgroundColor: CHART_COLORS.passed }}
              />
              <span className="duration-trend-label">{formatDateCompact(point.date)}</span>
            </button>
          );
        })}
      </div>
      {tooltip && (
        <div
          className="duration-trend-tooltip coverage-trend-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          role="tooltip"
        >
          <div><strong>Run {tooltip.point.runId}</strong></div>
          <div>{formatDate(tooltip.point.date)}</div>
          <div>{tooltip.point.branchLabel} · {tooltip.point.commitShortSha}</div>
          {tooltip.point.line !== undefined && <div>Line: {tooltip.point.line.toFixed(1)}%</div>}
          {tooltip.point.branch !== undefined && <div>Branch: {tooltip.point.branch.toFixed(1)}%</div>}
          {tooltip.point.coveredLines !== undefined && tooltip.point.totalLines !== undefined && (
            <div>Lines: {tooltip.point.coveredLines}/{tooltip.point.totalLines}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function runsToCoveragePoints(
  runs: EnrichedRun[],
  projectName?: string,
): CoverageTrendPoint[] {
  return runs
    .filter((run) => run.coverage?.line !== undefined)
    .map((run) => {
      const projectMetrics = projectName && run.coverage?.projects?.[projectName];
      const metrics = projectMetrics ?? run.coverage;
      return {
        runId: run.runId,
        date: run.date,
        branchLabel: run.branchLabel,
        commitShortSha: run.commitShortSha,
        line: metrics?.line,
        branch: metrics?.branch,
        coveredLines: metrics?.coveredLines,
        totalLines: metrics?.totalLines,
      };
    });
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
