import { useMemo, useState } from 'react';
import { useRepositoryTestTrends } from '../../hooks/useRepositoryTestTrends';
import { getProblematicTests } from '../../utils/testList';
import { ProblematicTestRow } from './ProblematicTestRow';

const DEFAULT_THRESHOLD = 95;

interface ProblematicTestsPanelProps {
  repoKey: string;
}

export function ProblematicTestsPanel({ repoKey }: ProblematicTestsPanelProps) {
  const { trends, loading } = useRepositoryTestTrends(repoKey);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const problematic = useMemo(
    () => getProblematicTests(trends, threshold),
    [trends, threshold],
  );

  const toggleHistory = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleThresholdChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    setThreshold(Math.min(100, Math.max(0, parsed)));
  };

  if (loading) {
    return (
      <div className="tab-panel" role="tabpanel">
        <p className="muted">Loading test trends…</p>
      </div>
    );
  }

  return (
    <div className="tab-panel" role="tabpanel">
      <div className="problematic-tests-toolbar">
        <label className="threshold-control" htmlFor="pass-threshold">
          Show tests below pass rate threshold
        </label>
        <div className="threshold-control-row">
          <input
            id="pass-threshold"
            type="number"
            className="threshold-input"
            min={0}
            max={100}
            step={1}
            value={threshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
            aria-label="Pass rate threshold percentage"
          />
          <span className="threshold-suffix">%</span>
          <span className="muted threshold-count">
            {problematic.length} test{problematic.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {problematic.length === 0 ? (
        <p className="empty-state">No tests below {threshold}% pass rate.</p>
      ) : (
        <div className="problematic-tests-table-wrap">
          <table className="data-table problematic-tests-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Class</th>
                <th>Pass rate</th>
                <th>Runs</th>
                <th className="text-right">History</th>
              </tr>
            </thead>
            <tbody>
              {problematic.map(({ name, entry }) => (
                <ProblematicTestRow
                  key={name}
                  name={name}
                  entry={entry}
                  repoKey={repoKey}
                  expanded={expanded.has(name)}
                  onToggleHistory={() => toggleHistory(name)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
