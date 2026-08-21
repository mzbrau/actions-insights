import type { NormalizedRunRecord, RunSummary } from '@actions-insights/history-models';
import { AiAgentInstructions } from './AiAgentInstructions';
import { FailureAccordion } from './FailureAccordion';
import { StatCard } from '../ui/StatCard';
import { OutcomeDonutStat } from '../ui/OutcomeDonutStat';
import { CoverageProgressBar, computeMetricsDelta, coverageDeltaClass, formatCoverageDelta } from '../ui/CoverageProgressBar';
import { CopyTestNameButton } from '../ui/CopyTestNameButton';
import { formatDuration, shortTestName } from '../../utils/format';
import { computeSuiteSummary } from '../../utils/testList';

interface RunSummaryPanelProps {
  run: NormalizedRunRecord;
  runSummary: RunSummary;
  branchHistory: RunSummary[];
  expanded: Set<string>;
  onToggleFailure: (fullName: string) => void;
  slowTests: Array<{ n: string; d: number }>;
}

function findComparisonRun(
  runSummary: RunSummary,
  branchHistory: RunSummary[],
  isPullRequest: boolean,
): RunSummary | undefined {
  const idx = branchHistory.findIndex((r) => r.runId === runSummary.runId);
  if (isPullRequest) {
    return branchHistory.find((r, i) => i > idx && r.coverage?.line !== undefined);
  }
  for (let i = idx + 1; i < branchHistory.length; i += 1) {
    if (branchHistory[i].coverage?.line !== undefined) return branchHistory[i];
  }
  return undefined;
}

export function RunSummaryPanel({
  run,
  runSummary,
  branchHistory,
  expanded,
  onToggleFailure,
  slowTests,
}: RunSummaryPanelProps) {
  const failures = run.failures;
  const suiteSummary = computeSuiteSummary(run.tests);
  const hasSuiteSummary = suiteSummary.length > 1 || (suiteSummary.length === 1 && suiteSummary[0].suite !== '—');
  const coverage = runSummary.coverage;
  const comparison = coverage
    ? findComparisonRun(runSummary, branchHistory, run.context.branchType === 'pr')
    : undefined;
  const delta = computeMetricsDelta(coverage, comparison?.coverage);

  return (
    <div className="tab-panel" role="tabpanel">
      <div className="stats-grid">
        <StatCard label="Total" value={run.stats.total} />
        <StatCard label="Passed" value={run.stats.passed} variant="passed" />
        <StatCard label="Failed" value={run.stats.failed} variant="failed" />
        <StatCard label="Skipped" value={run.stats.skipped} />
        <StatCard label="Duration" value={formatDuration(run.durationMs)} />
        <StatCard label="Success" value={`${run.stats.successRate}%`} />
        {coverage?.line !== undefined && (
          <StatCard
            label="Line Coverage"
            value={`${coverage.line.toFixed(1)}%`}
            hint={formatCoverageDelta(delta.line) ? `${formatCoverageDelta(delta.line)} vs ${run.context.branchType === 'pr' ? 'base' : 'previous'}` : undefined}
            hintClass={coverageDeltaClass(delta.line)}
          />
        )}
        {coverage?.branch !== undefined && (
          <StatCard
            label="Branch Coverage"
            value={`${coverage.branch.toFixed(1)}%`}
            hint={formatCoverageDelta(delta.branch) ? `${formatCoverageDelta(delta.branch)} vs ${run.context.branchType === 'pr' ? 'base' : 'previous'}` : undefined}
            hintClass={coverageDeltaClass(delta.branch)}
          />
        )}
        <OutcomeDonutStat
          passed={run.stats.passed}
          failed={run.stats.failed}
          skipped={run.stats.skipped}
          inconclusive={run.stats.inconclusive}
        />
      </div>

      {hasSuiteSummary && (
        <section className="section">
          <h2 className="section-title">Per Suite Summary</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Suite</th>
                  <th>Total</th>
                  <th>Passed</th>
                  <th>Failed</th>
                  <th>Skipped</th>
                  <th>Inconclusive</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {suiteSummary.map((s) => (
                  <tr key={s.suite} className={s.failed > 0 ? 'failed' : s.passed === s.total ? 'passed' : ''}>
                    <td>{s.suite === '—' ? 'No suite' : s.suite}</td>
                    <td>{s.total.toLocaleString()}</td>
                    <td>{s.passed.toLocaleString()}</td>
                    <td>{s.failed.toLocaleString()}</td>
                    <td>{s.skipped.toLocaleString()}</td>
                    <td>{s.inconclusive.toLocaleString()}</td>
                    <td>{formatDuration(s.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {coverage?.line !== undefined && (
        <section className="section coverage-summary-section">
          <h2 className="section-title">Code Coverage</h2>
          <div className="coverage-summary-bars">
            <CoverageProgressBar label="Line coverage" value={coverage.line} variant="line" />
            <CoverageProgressBar label="Branch coverage" value={coverage.branch} variant="branch" />
          </div>
        </section>
      )}

      {failures.length > 0 && (
        <section className="section">
          <h2 className="section-title">Failed Tests ({failures.length})</h2>
          <FailureAccordion failures={failures} expanded={expanded} onToggle={onToggleFailure} />
          <AiAgentInstructions run={run} />
        </section>
      )}

      {slowTests.length > 0 && (
        <section className="section">
          <h2 className="section-title">Slow tests</h2>
          <ul className="simple-list">
            {slowTests.map((t) => (
              <li key={t.n}>
                ⏱ {shortTestName(t.n)}
                <CopyTestNameButton fullName={t.n} />
                {' '}— {formatDuration(t.d)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
