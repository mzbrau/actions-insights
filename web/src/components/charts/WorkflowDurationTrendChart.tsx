import { useCallback, useRef, useState } from 'react';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { CHART_COLORS, maxValue } from '../../utils/chart';
import { formatDate, formatDateCompact, formatDuration } from '../../utils/format';

export interface WorkflowDurationPoint {
  runId: string;
  date: string;
  branchLabel: string;
  commitShortSha: string;
  workflowDurationMs?: number;
  testDurationMs: number;
}

interface WorkflowDurationTrendChartProps {
  points: WorkflowDurationPoint[];
  metric?: 'workflow' | 'tests';
  onBarClick?: (runId: string) => void;
}

interface TooltipState {
  point: WorkflowDurationPoint;
  x: number;
  y: number;
  metric: 'workflow' | 'tests';
}

export function WorkflowDurationTrendChart({
  points,
  metric = 'workflow',
  onBarClick,
}: WorkflowDurationTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const chartPoints = points.filter((p) =>
    metric === 'workflow' ? p.workflowDurationMs !== undefined : p.testDurationMs > 0,
  );

  const values = chartPoints.map((p) =>
    metric === 'workflow' ? p.workflowDurationMs! : p.testDurationMs,
  );
  const maxMs = maxValue(values.length > 0 ? values : [1]);

  const showTooltip = useCallback((point: WorkflowDurationPoint, target: HTMLElement) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setTooltip({
      point,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top,
      metric,
    });
  }, [metric]);

  if (chartPoints.length === 0) {
    return <p className="chart-empty">No workflow timing data</p>;
  }

  return (
    <div ref={containerRef} className="duration-trend-chart workflow-duration-chart">
      <div className="duration-trend-bar-area">
        {chartPoints.map((point) => {
          const value = metric === 'workflow' ? point.workflowDurationMs! : point.testDurationMs;
          const pct = Math.max(4, (value / maxMs) * 100);
          const label = formatDuration(value);
          return (
            <button
              key={point.runId}
              type="button"
              className="duration-trend-bar passed"
              onMouseEnter={(e) => showTooltip(point, e.currentTarget)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => showTooltip(point, e.currentTarget)}
              onBlur={() => setTooltip(null)}
              onClick={() => onBarClick?.(point.runId)}
              aria-label={`Run ${point.runId}: ${label}`}
            >
              <div className="duration-trend-bar-track">
                <span
                  className="duration-trend-bar-fill"
                  style={{ height: `${pct}%`, background: CHART_COLORS.info }}
                />
              </div>
              <span className="duration-trend-bar-key" title={label}>{label}</span>
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
          {tooltip.metric === 'workflow' && tooltip.point.workflowDurationMs !== undefined && (
            <div>Workflow: {formatDuration(tooltip.point.workflowDurationMs)}</div>
          )}
          <div>Tests: {formatDuration(tooltip.point.testDurationMs)}</div>
        </div>
      )}
    </div>
  );
}

export function runsToWorkflowDurationPoints(runs: EnrichedRun[]): WorkflowDurationPoint[] {
  return runs
    .filter((run) => run.timing?.workflowDurationMs !== undefined || run.durationMs > 0)
    .map((run) => ({
      runId: run.runId,
      date: run.date,
      branchLabel: run.branchLabel,
      commitShortSha: run.commitShortSha,
      workflowDurationMs: run.timing?.workflowDurationMs,
      testDurationMs: run.durationMs,
    }));
}
