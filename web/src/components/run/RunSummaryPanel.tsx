import type { BranchHistory, RunRecord } from '@actions-insights/history-models';
import { DonutChart } from '../charts/DonutChart';
import { StackedBarChart } from '../charts/StackedBarChart';
import { FailureAccordion } from './FailureAccordion';
import { StatCard } from '../ui/StatCard';
import { StatusBanner } from '../ui/StatusBanner';
import { ChartCard } from '../ui/ChartCard';
import { formatDuration, shortTestName } from '../../utils/format';

interface RunSummaryPanelProps {
  run: RunRecord;
  history: BranchHistory | null;
  expanded: Set<string>;
  onToggleFailure: (fullName: string) => void;
  slowTests: Array<{ n: string; d: number }>;
}

export function RunSummaryPanel({
  run,
  history,
  expanded,
  onToggleFailure,
  slowTests,
}: RunSummaryPanelProps) {
  const failures = run.failures;
  const statusLabel = run.status === 'passed' ? '✅ PASSED' : '❌ FAILED';
  const subtitle =
    run.status === 'passed'
      ? `All ${run.stats.total} tests passed · ${formatDuration(run.durationMs)} total`
      : `${run.stats.failed} of ${run.stats.total} tests failed · ${formatDuration(run.durationMs)} total`;

  return (
    <div className="tab-panel" role="tabpanel">
      <StatusBanner
        status={run.status}
        title={statusLabel}
        subtitle={subtitle}
      />

      <div className="stats-grid">
        <StatCard label="Total" value={run.stats.total} />
        <StatCard label="Passed" value={run.stats.passed} variant="passed" />
        <StatCard label="Failed" value={run.stats.failed} variant="failed" />
        <StatCard label="Skipped" value={run.stats.skipped} />
        <StatCard label="Duration" value={formatDuration(run.durationMs)} />
        <StatCard label="Success" value={`${run.stats.successRate}%`} />
      </div>

      <div className="charts-row">
        <ChartCard title="Outcome Distribution">
          <DonutChart
            passed={run.stats.passed}
            failed={run.stats.failed}
            skipped={run.stats.skipped}
            inconclusive={run.stats.inconclusive}
          />
        </ChartCard>
        <ChartCard title="Recent Runs (branch)">
          <StackedBarChart runs={history?.runs ?? []} />
        </ChartCard>
      </div>

      {failures.length > 0 && (
        <section className="section">
          <h2 className="section-title">Failed Tests ({failures.length})</h2>
          <FailureAccordion failures={failures} expanded={expanded} onToggle={onToggleFailure} />
        </section>
      )}

      {slowTests.length > 0 && (
        <section className="section">
          <h2 className="section-title">Slow tests</h2>
          <ul className="simple-list">
            {slowTests.map((t) => (
              <li key={t.n}>⏱ {shortTestName(t.n)} — {formatDuration(t.d)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
