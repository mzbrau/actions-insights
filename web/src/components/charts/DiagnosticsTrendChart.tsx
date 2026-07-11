import { useCallback, useRef, useState } from 'react';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { CHART_COLORS, maxValue } from '../../utils/chart';
import { formatDate, formatDateCompact } from '../../utils/format';

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
  onBarClick?: (runId: string) => void;
}

interface TooltipState {
  point: DiagnosticsTrendPoint;
  x: number;
  y: number;
}

export function DiagnosticsTrendChart({ points, onBarClick }: DiagnosticsTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const chartPoints = points.filter((p) => p.errors > 0 || p.warnings > 0);
  const maxCount = maxValue(
    chartPoints.length > 0
      ? chartPoints.map((p) => Math.max(p.errors, p.warnings))
      : [1],
  );

  const showTooltip = useCallback((point: DiagnosticsTrendPoint, target: HTMLElement) => {
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
    return <p className="chart-empty">No diagnostic data</p>;
  }

  return (
    <div ref={containerRef} className="duration-trend-chart diagnostics-trend-chart">
      <div className="duration-trend-bar-area">
        {chartPoints.map((point) => {
          const total = point.errors + point.warnings;
          const errorPct = total > 0 ? (point.errors / maxCount) * 100 : 0;
          const warningPct = total > 0 ? (point.warnings / maxCount) * 100 : 0;
          return (
            <button
              key={point.runId}
              type="button"
              className="duration-trend-bar diagnostics-trend-bar"
              onMouseEnter={(e) => showTooltip(point, e.currentTarget)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => showTooltip(point, e.currentTarget)}
              onBlur={() => setTooltip(null)}
              onClick={() => onBarClick?.(point.runId)}
              aria-label={`Run ${point.runId}: ${point.errors} errors, ${point.warnings} warnings`}
            >
              <div className="duration-trend-bar-track diagnostics-stacked-track">
                {point.errors > 0 && (
                  <span
                    className="duration-trend-bar-fill diagnostics-error-fill"
                    style={{ height: `${Math.max(4, errorPct)}%`, background: CHART_COLORS.failed }}
                  />
                )}
                {point.warnings > 0 && (
                  <span
                    className="duration-trend-bar-fill diagnostics-warning-fill"
                    style={{ height: `${Math.max(4, warningPct)}%`, background: CHART_COLORS.skipped }}
                  />
                )}
              </div>
              <span className="duration-trend-bar-key" title={`${point.errors}E / ${point.warnings}W`}>
                {point.errors}E/{point.warnings}W
              </span>
              <span className="duration-trend-bar-date">{formatDateCompact(point.date)}</span>
            </button>
          );
        })}
      </div>
      {tooltip && (
        <div
          className="duration-trend-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          role="tooltip"
        >
          <div><strong>Run {tooltip.point.runId}</strong></div>
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
