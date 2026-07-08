import type { RunRecord } from '@actions-insights/history-models';
import { FailureAccordion } from './FailureAccordion';
import { StatCard } from '../ui/StatCard';
import { OutcomeDonutStat } from '../ui/OutcomeDonutStat';
import { formatDuration, shortTestName } from '../../utils/format';

interface RunSummaryPanelProps {
  run: RunRecord;
  expanded: Set<string>;
  onToggleFailure: (fullName: string) => void;
  slowTests: Array<{ n: string; d: number }>;
}

export function RunSummaryPanel({
  run,
  expanded,
  onToggleFailure,
  slowTests,
}: RunSummaryPanelProps) {
  const failures = run.failures;

  return (
    <div className="tab-panel" role="tabpanel">
      <div className="stats-grid">
        <StatCard label="Total" value={run.stats.total} />
        <StatCard label="Passed" value={run.stats.passed} variant="passed" />
        <StatCard label="Failed" value={run.stats.failed} variant="failed" />
        <StatCard label="Skipped" value={run.stats.skipped} />
        <StatCard label="Duration" value={formatDuration(run.durationMs)} />
        <StatCard label="Success" value={`${run.stats.successRate}%`} />
        <OutcomeDonutStat
          passed={run.stats.passed}
          failed={run.stats.failed}
          skipped={run.stats.skipped}
          inconclusive={run.stats.inconclusive}
        />
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
