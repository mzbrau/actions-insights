import type { TestHistoryPoint } from '@actions-insights/history-models';
import { CODE_TO_OUTCOME } from '@actions-insights/history-models';
import { formatDuration, outcomeIcon } from '../../utils/format';

interface TestHistorySparklineProps {
  points: TestHistoryPoint[];
  maxBars?: number;
}

export function TestHistorySparkline({ points, maxBars = 20 }: TestHistorySparklineProps) {
  const recent = points.slice(0, maxBars);
  const maxD = Math.max(...recent.map((p) => p.d), 1);

  return (
    <div className="history-sparkline" role="img" aria-label="Test run history">
      {[...recent].reverse().map((p) => {
        const outcome = CODE_TO_OUTCOME[p.o] ?? 'inconclusive';
        const cls = outcome === 'passed' ? 'passed' : outcome === 'failed' ? 'failed' : outcome === 'skipped' ? 'skipped' : 'other';
        const h = Math.max(4, (p.d / maxD) * 24);
        const title = `${p.branchLabel} · ${outcome} · ${formatDuration(p.d)}`;
        return (
          <div
            key={`${p.runId}-${p.branchKey}-${p.date}`}
            className={`spark-bar ${cls}`}
            style={{ height: `${h}px` }}
            title={title}
          />
        );
      })}
    </div>
  );
}

interface TestHistoryPanelProps {
  entry: { passRate: number; runCount: number; points: TestHistoryPoint[] } | null;
}

export function TestHistoryPanel({ entry }: TestHistoryPanelProps) {
  if (!entry || entry.points.length === 0) {
    return <p className="muted small">No history available yet.</p>;
  }

  const recent = entry.points.slice(0, 20);

  return (
    <div className="test-history-content">
      <TestHistorySparkline points={entry.points} />
      <div className="test-history-summary">
        Pass rate: {entry.passRate}% ({entry.runCount} runs)
      </div>
      <table className="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Branch</th>
            <th>Result</th>
            <th>Duration</th>
            <th>Commit</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((p) => (
              <tr key={`${p.runId}-${p.branchKey}-${p.date}`}>
                <td>{new Date(p.date).toLocaleString()}</td>
                <td>{p.branchLabel}</td>
                <td>{outcomeIcon(p.o)}</td>
                <td>{formatDuration(p.d)}</td>
                <td><code>{p.commitShortSha}</code></td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
