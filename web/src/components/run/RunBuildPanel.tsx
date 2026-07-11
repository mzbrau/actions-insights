import { useMemo, useState } from 'react';
import type {
  DiagnosticRunRecord,
  DiagnosticSummaryCompact,
  NormalizedDiagnosticItem,
  RunSummary,
  TimingRunRecord,
  TimingSummaryCompact,
} from '@actions-insights/history-models';
import { expandDiagnosticItems } from '@actions-insights/history-models';
import { ChartCard } from '../ui/ChartCard';
import { formatDuration } from '../../utils/format';

interface RunBuildPanelProps {
  runSummary: RunSummary;
  diagnosticsSummary?: DiagnosticSummaryCompact;
  timingSummary?: TimingSummaryCompact;
  diagnosticsDetail: DiagnosticRunRecord | null;
  timingDetail: TimingRunRecord | null;
  detailLoading: boolean;
  onRequestDetail: () => void;
}

type SeverityFilter = 'all' | 'error' | 'warning' | 'note';

export function RunBuildPanel({
  diagnosticsSummary,
  timingSummary,
  diagnosticsDetail,
  timingDetail,
  detailLoading,
  onRequestDetail,
}: RunBuildPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [showAllDiagnostics, setShowAllDiagnostics] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const items: NormalizedDiagnosticItem[] = useMemo(() => {
    if (!diagnosticsDetail) return [];
    return expandDiagnosticItems(diagnosticsDetail);
  }, [diagnosticsDetail]);

  const filteredItems = useMemo(() => {
    if (severityFilter === 'all') return items;
    return items.filter((i) => i.severity === severityFilter);
  }, [items, severityFilter]);

  const byFile = useMemo(() => {
    const map = new Map<string, NormalizedDiagnosticItem[]>();
    for (const item of filteredItems) {
      const key = item.file ?? '(no file)';
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filteredItems]);

  const steps = timingDetail?.summary.steps ?? [];
  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => b.durationMs - a.durationMs),
    [steps],
  );
  const maxStepMs = sortedSteps[0]?.durationMs ?? 1;

  const toggleFile = (file: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  };

  const handleExpandDiagnostics = () => {
    if (!diagnosticsDetail && !detailLoading) {
      onRequestDetail();
    }
    setShowAllDiagnostics(true);
  };

  return (
    <div className="run-build-panel tab-panel" role="tabpanel">
      <div className="build-summary-cards">
        {diagnosticsSummary && (
          <>
            <div className="build-summary-card build-summary-card--error">
              <span className="build-summary-card-value">{diagnosticsSummary.errors}</span>
              <span className="build-summary-card-label">Errors</span>
            </div>
            <div className="build-summary-card build-summary-card--warning">
              <span className="build-summary-card-value">{diagnosticsSummary.warnings}</span>
              <span className="build-summary-card-label">Warnings</span>
            </div>
          </>
        )}
        {timingSummary?.workflowDurationMs !== undefined && (
          <div className="build-summary-card">
            <span className="build-summary-card-value">{formatDuration(timingSummary.workflowDurationMs)}</span>
            <span className="build-summary-card-label">Workflow</span>
          </div>
        )}
        {timingSummary?.slowestStep && (
          <div className="build-summary-card build-summary-card--wide">
            <span className="build-summary-card-value build-summary-card-value--small">{timingSummary.slowestStep}</span>
            <span className="build-summary-card-label">Slowest step</span>
          </div>
        )}
      </div>

      {steps.length > 0 && (
        <ChartCard title="Workflow steps">
          <div className="workflow-step-timeline">
            {sortedSteps.map((step) => (
              <div key={`${step.jobName}-${step.stepNumber}`} className="workflow-step-row">
                <div className="workflow-step-label">
                  <span className="workflow-step-job">{step.jobName}</span>
                  <span className="workflow-step-name">{step.stepName}</span>
                </div>
                <div className="workflow-step-bar-track">
                  <span
                    className="workflow-step-bar-fill"
                    style={{ width: `${Math.max(4, (step.durationMs / maxStepMs) * 100)}%` }}
                  />
                </div>
                <span className="workflow-step-duration">{formatDuration(step.durationMs)}</span>
              </div>
            ))}
          </div>
          {timingDetail?.runner && (
            <p className="workflow-runner-meta">
              Runner: {timingDetail.runner.os ?? 'unknown'}
              {timingDetail.runner.labels?.length ? ` (${timingDetail.runner.labels.join(', ')})` : ''}
            </p>
          )}
          {timingDetail?.summary.actionPhases && Object.keys(timingDetail.summary.actionPhases).length > 0 && (
            <details className="action-phases-details">
              <summary>Actions Insights phases</summary>
              <ul>
                {Object.entries(timingDetail.summary.actionPhases).map(([name, ms]) => (
                  <li key={name}>{name}: {formatDuration(ms)}</li>
                ))}
              </ul>
            </details>
          )}
        </ChartCard>
      )}

      {diagnosticsSummary && (
        <ChartCard title="Diagnostics by file">
          {!diagnosticsDetail && !detailLoading && (
            <button type="button" className="btn-secondary" onClick={handleExpandDiagnostics}>
              Load diagnostic details
            </button>
          )}
          {detailLoading && <p className="chart-empty">Loading diagnostics…</p>}
          {diagnosticsDetail && (
            <>
              <div className="diagnostic-filters">
                {(['all', 'error', 'warning', 'note'] as SeverityFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={severityFilter === f ? 'filter-chip active' : 'filter-chip'}
                    onClick={() => setSeverityFilter(f)}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {byFile.slice(0, showAllDiagnostics ? undefined : 10).map(([file, fileItems]) => (
                <details
                  key={file}
                  className="diagnostic-file-group"
                  open={expandedFiles.has(file)}
                  onToggle={(e) => {
                    if ((e.target as HTMLDetailsElement).open !== expandedFiles.has(file)) {
                      toggleFile(file);
                    }
                  }}
                >
                  <summary>
                    <code>{file}</code>
                    <span className="diagnostic-file-count">{fileItems.length}</span>
                  </summary>
                  <ul className="diagnostic-item-list">
                    {fileItems.map((item, idx) => (
                      <li key={idx} className={`diagnostic-item diagnostic-item--${item.severity}`}>
                        <span className="diagnostic-item-severity">{item.severity}</span>
                        {item.code && <code className="diagnostic-item-code">{item.code}</code>}
                        {item.line !== undefined && (
                          <span className="diagnostic-item-location">:{item.line}</span>
                        )}
                        <span className="diagnostic-item-message">{item.message}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              {!showAllDiagnostics && byFile.length > 10 && (
                <button type="button" className="btn-secondary" onClick={() => setShowAllDiagnostics(true)}>
                  Show all {byFile.length} files
                </button>
              )}
              {diagnosticsDetail.truncated !== undefined && diagnosticsDetail.truncated > 0 && (
                <p className="diagnostic-truncated-note">
                  {diagnosticsDetail.truncated} additional diagnostic(s) omitted from storage.
                </p>
              )}
            </>
          )}
        </ChartCard>
      )}
    </div>
  );
}
