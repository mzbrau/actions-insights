import { useCallback, useRef, useState } from 'react';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { BUILD_PERFORMANCE_MAX_RUNS, CHART_COLORS, maxValue } from '../../utils/chart';
import { formatDate, formatDateCompact, formatDuration, statusIcon } from '../../utils/format';

interface DurationTrendChartProps {
  runs: EnrichedRun[];
  /** When true, bar keys show run id instead of branch/PR label */
  singleBranchView?: boolean;
  onBarClick?: (run: EnrichedRun) => void;
}

interface TooltipState {
  run: EnrichedRun;
  x: number;
  y: number;
}

export function DurationTrendChart({
  runs,
  singleBranchView = false,
  onBarClick,
}: DurationTrendChartProps) {
  const points = runs.slice(-BUILD_PERFORMANCE_MAX_RUNS);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = useCallback((run: EnrichedRun, target: HTMLElement) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const x = targetRect.left - containerRect.left + targetRect.width / 2;
    const y = targetRect.top - containerRect.top;
    setTooltip({ run, x, y });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  if (points.length === 0) {
    return <p className="chart-empty">No duration data</p>;
  }

  const maxDur = maxValue(points.map((p) => p.durationMs));

  const barLabel = (run: EnrichedRun) => (
    singleBranchView ? run.runId : run.branchLabel
  );

  return (
    <div ref={containerRef} className="duration-trend-chart">
      <div className="duration-trend-bar-area">
        {points.map((run) => {
          const pct = Math.max(4, (run.durationMs / maxDur) * 100);
          const color = run.status === 'failed' ? CHART_COLORS.failed : CHART_COLORS.passed;
          const label = barLabel(run);

          return (
            <button
              key={run.runId}
              type="button"
              className={`duration-trend-bar${run.status === 'failed' ? ' failed' : ' passed'}`}
              onClick={() => onBarClick?.(run)}
              onMouseEnter={(e) => showTooltip(run, e.currentTarget)}
              onMouseLeave={hideTooltip}
              onFocus={(e) => showTooltip(run, e.currentTarget)}
              onBlur={hideTooltip}
              aria-label={`${label}, ${formatDuration(run.durationMs)}, ${run.status}`}
            >
              <div className="duration-trend-bar-track">
                <span
                  className="duration-trend-bar-fill"
                  style={{ height: `${pct}%`, background: color }}
                />
              </div>
              <span className="duration-trend-bar-key" title={label}>{label}</span>
              <span className="duration-trend-bar-date">{formatDateCompact(run.date)}</span>
            </button>
          );
        })}
      </div>

      {tooltip && (
        <div
          className="duration-trend-tooltip"
          role="tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className="duration-trend-tooltip-status">
            {statusIcon(tooltip.run.status)} {tooltip.run.status}
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
            <span className="duration-trend-tooltip-label">Tests</span>
            <span>
              <span className="passed-text">{tooltip.run.passed} passed</span>
              {' · '}
              <span className="failed-text">{tooltip.run.failed} failed</span>
              {tooltip.run.total > 0 && ` · ${tooltip.run.total} total`}
            </span>
          </div>
          <div className="duration-trend-tooltip-row">
            <span className="duration-trend-tooltip-label">Date</span>
            <span>{formatDate(tooltip.run.date)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
