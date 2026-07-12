import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { formatDuration } from '../../utils/format';
import { DiagnosticsTrendChart, runsToDiagnosticsPoints } from '../charts/DiagnosticsTrendChart';
import { WorkflowDurationTrendChart, runsToWorkflowDurationPoints } from '../charts/WorkflowDurationTrendChart';
import { ChartCard } from '../ui/ChartCard';

interface BuildInsightsPanelProps {
  repoKey: string;
  runs: EnrichedRun[];
}

export function BuildInsightsPanel({ repoKey, runs }: BuildInsightsPanelProps) {
  const navigate = useNavigate();
  const trendRuns = useMemo(() => [...runs].reverse().slice(-30), [runs]);

  const diagnosticRuns = trendRuns.filter((r) => r.diagnostics !== undefined);
  const timingRuns = trendRuns.filter((r) => r.timing?.workflowDurationMs !== undefined);

  const latestDiagnostics = diagnosticRuns[diagnosticRuns.length - 1]?.diagnostics;
  const latestTiming = timingRuns[timingRuns.length - 1]?.timing;
  const avgWorkflowMs = useMemo(() => {
    const values = timingRuns
      .map((r) => r.timing?.workflowDurationMs)
      .filter((v): v is number => v !== undefined);
    if (values.length === 0) return undefined;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [timingRuns]);

  const onRunClick = (runId: string) => {
    const run = trendRuns.find((r) => r.runId === runId);
    if (run) {
      navigate(`/r/${repoKey}/b/${encodeURIComponent(run.branchKey)}/run/${runId}?tab=build`);
    }
  };

  if (diagnosticRuns.length === 0 && timingRuns.length === 0) {
    return (
      <div className="tab-panel" role="tabpanel">
        <p className="chart-empty">No build diagnostic or workflow timing data available yet.</p>
      </div>
    );
  }

  return (
    <div className="tab-panel build-insights-panel" role="tabpanel">
      <div className="build-insights-stats">
        {latestDiagnostics && (
          <div className="build-insight-stat">
            <span className="build-insight-stat-label">Latest diagnostics</span>
            <span className="build-insight-stat-value">
              {latestDiagnostics.errors} errors · {latestDiagnostics.warnings} warnings
            </span>
          </div>
        )}
        {latestTiming?.workflowDurationMs !== undefined && (
          <div className="build-insight-stat">
            <span className="build-insight-stat-label">Latest workflow</span>
            <span className="build-insight-stat-value">{formatDuration(latestTiming.workflowDurationMs)}</span>
          </div>
        )}
        {avgWorkflowMs !== undefined && (
          <div className="build-insight-stat">
            <span className="build-insight-stat-label">Avg workflow (30 runs)</span>
            <span className="build-insight-stat-value">{formatDuration(avgWorkflowMs)}</span>
          </div>
        )}
        {latestTiming?.slowestStep && (
          <div className="build-insight-stat">
            <span className="build-insight-stat-label">Slowest step</span>
            <span className="build-insight-stat-value">{latestTiming.slowestStep}</span>
          </div>
        )}
      </div>

      {diagnosticRuns.length > 0 && (
        <ChartCard title="Build Diagnostics (errors / warnings)" trend>
          <DiagnosticsTrendChart
            points={runsToDiagnosticsPoints(diagnosticRuns)}
            onPointClick={onRunClick}
          />
        </ChartCard>
      )}

      {timingRuns.length > 0 && (
        <ChartCard title="Workflow Duration" trend>
          <WorkflowDurationTrendChart
            points={runsToWorkflowDurationPoints(timingRuns)}
            onPointClick={onRunClick}
          />
        </ChartCard>
      )}
    </div>
  );
}
