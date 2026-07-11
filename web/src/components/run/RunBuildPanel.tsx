import { useEffect, useMemo, useState } from 'react';
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

interface FileCounts {
  errors: number;
  warnings: number;
  notes: number;
}

function countBySeverity(items: NormalizedDiagnosticItem[]): FileCounts {
  let errors = 0;
  let warnings = 0;
  let notes = 0;
  for (const item of items) {
    if (item.severity === 'error') errors += 1;
    else if (item.severity === 'warning') warnings += 1;
    else notes += 1;
  }
  return { errors, warnings, notes };
}

function FileCountBadges({ counts }: { counts: FileCounts }) {
  return (
    <span className="diagnostic-file-badges">
      {counts.errors > 0 && (
        <span className="diagnostic-count-badge diagnostic-count-badge--error">{counts.errors}E</span>
      )}
      {counts.warnings > 0 && (
        <span className="diagnostic-count-badge diagnostic-count-badge--warning">{counts.warnings}W</span>
      )}
      {counts.notes > 0 && (
        <span className="diagnostic-count-badge diagnostic-count-badge--note">{counts.notes}N</span>
      )}
    </span>
  );
}

export function RunBuildPanel({
  runSummary,
  diagnosticsSummary,
  timingSummary,
  diagnosticsDetail,
  timingDetail,
  detailLoading,
  onRequestDetail,
}: RunBuildPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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

  useEffect(() => {
    if (byFile.length === 0) {
      setSelectedFile(null);
      return;
    }
    if (selectedFile === null || !byFile.some(([file]) => file === selectedFile)) {
      setSelectedFile(byFile[0][0]);
    }
  }, [byFile, selectedFile]);

  const selectedItems = useMemo(
    () => byFile.find(([file]) => file === selectedFile)?.[1] ?? [],
    [byFile, selectedFile],
  );

  const steps = timingDetail?.summary.steps ?? [];
  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => b.durationMs - a.durationMs),
    [steps],
  );
  const maxStepMs = sortedSteps[0]?.durationMs ?? 1;

  const handleExpandDiagnostics = () => {
    if (!diagnosticsDetail && !detailLoading) {
      onRequestDetail();
    }
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
            <span className="build-summary-card-label">Workflow run</span>
          </div>
        )}
        {runSummary.durationMs > 0 && (
          <div className="build-summary-card">
            <span className="build-summary-card-value">{formatDuration(runSummary.durationMs)}</span>
            <span className="build-summary-card-label">Test execution</span>
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
        <>
          <p className="build-timing-note">
            Step durations are wall-clock times per step. Parallel jobs overlap — they do not add up to workflow run time.
          </p>
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
          </ChartCard>
          {(timingDetail?.runner || (timingDetail?.summary.actionPhases && Object.keys(timingDetail.summary.actionPhases).length > 0)) && (
            <section className="build-run-metadata">
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
            </section>
          )}
        </>
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
            <div className="diagnostic-browser">
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

              {byFile.length === 0 ? (
                <p className="chart-empty">No diagnostics match this filter.</p>
              ) : (
                <div className="diagnostic-browser-panes">
                  <div className="diagnostic-file-list" role="listbox" aria-label="Files with diagnostics">
                    {byFile.map(([file, fileItems]) => {
                      const counts = countBySeverity(fileItems);
                      const isActive = file === selectedFile;
                      return (
                        <button
                          key={file}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`diagnostic-file-row${isActive ? ' active' : ''}`}
                          onClick={() => setSelectedFile(file)}
                          title={file}
                        >
                          <code className="diagnostic-file-path">{file}</code>
                          <FileCountBadges counts={counts} />
                        </button>
                      );
                    })}
                  </div>

                  <div className="diagnostic-detail-panel">
                    {selectedFile ? (
                      <>
                        <div className="diagnostic-detail-header">
                          <code>{selectedFile}</code>
                          <FileCountBadges counts={countBySeverity(selectedItems)} />
                        </div>
                        <ul className="diagnostic-item-list">
                          {selectedItems.map((item, idx) => (
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
                      </>
                    ) : (
                      <p className="chart-empty">Select a file to view diagnostics.</p>
                    )}
                  </div>
                </div>
              )}

              {diagnosticsDetail.truncated !== undefined && diagnosticsDetail.truncated > 0 && (
                <p className="diagnostic-truncated-note">
                  {diagnosticsDetail.truncated} additional diagnostic(s) omitted from storage.
                </p>
              )}
            </div>
          )}
        </ChartCard>
      )}
    </div>
  );
}
