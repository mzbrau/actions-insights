import type { TestHistoryEntry } from '@actions-insights/history-models';
import {
  getClassNameFromFullName,
  getShortNameFromFullName,
} from '../../utils/testList';
import { TestHistoryPanel } from '../run/TestHistoryPanel';

const COL_SPAN = 5;

interface ProblematicTestRowProps {
  name: string;
  entry: TestHistoryEntry;
  repoKey: string;
  expanded: boolean;
  onToggleHistory: () => void;
}

export function ProblematicTestRow({
  name,
  entry,
  repoKey,
  expanded,
  onToggleHistory,
}: ProblematicTestRowProps) {
  const historyId = `problematic-hist-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  return (
    <>
      <tr className="test-table-row" data-name={name}>
        <td className="tests-col-name">
          <span className="test-name" title={name}>{getShortNameFromFullName(name)}</span>
        </td>
        <td className="tests-col-class test-class-cell">
          <span className="test-class mono small" title={getClassNameFromFullName(name)}>
            {getClassNameFromFullName(name)}
          </span>
        </td>
        <td className="tests-col-passrate">{entry.passRate}%</td>
        <td className="tests-col-runs">{entry.runCount}</td>
        <td className="tests-col-history text-right">
          <button
            type="button"
            className={`history-btn${expanded ? ' active' : ''}`}
            aria-expanded={expanded}
            aria-controls={historyId}
            onClick={(e) => {
              e.stopPropagation();
              onToggleHistory();
            }}
          >
            History
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="test-history-row">
          <td colSpan={COL_SPAN}>
            <div className="test-history open" id={historyId}>
              <TestHistoryPanel entry={entry} repoKey={repoKey} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
