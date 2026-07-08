import type { CompactTestRecord, TestHistoryEntry } from '@actions-insights/history-models';
import { formatDuration, outcomeIcon } from '../../utils/format';
import {
  buildCodeSearchUrl,
  getClassName,
  getPassRateFromTrends,
  getShortName,
} from '../../utils/testList';
import { TestHistoryPanel } from './TestHistoryPanel';

const COL_SPAN = 7;

interface TestRowProps {
  test: CompactTestRecord;
  repository: string;
  workflowUrl?: string;
  jobUrl?: string;
  trends: Record<string, TestHistoryEntry> | null;
  expanded: boolean;
  onToggleHistory: () => void;
  hideClass?: boolean;
}

export function TestRow({
  test,
  repository,
  workflowUrl,
  jobUrl,
  trends,
  expanded,
  onToggleHistory,
  hideClass = false,
}: TestRowProps) {
  const logUrl = jobUrl || workflowUrl;
  const codeUrl = repository ? buildCodeSearchUrl(repository, test) : null;
  const pr = getPassRateFromTrends(trends, test.n);
  const cls = getClassName(test);
  const historyId = `hist-${test.i}`;

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <tr className="test-table-row" data-name={test.n}>
        <td>
          <span className="test-outcome">{outcomeIcon(test.o)}</span>
        </td>
        <td>
          <span className="test-name" title={test.n}>{getShortName(test)}</span>
        </td>
        <td className="test-class-cell">
          {!hideClass && <span className="mono small">{cls}</span>}
        </td>
        <td>{formatDuration(test.d)}</td>
        <td>{pr ? `${pr.rate}%` : '—'}</td>
        <td className="test-links-cell">
          {logUrl && (
            <a href={logUrl} target="_blank" rel="noreferrer" onClick={stopPropagation}>log</a>
          )}
          {codeUrl && (
            <>
              {logUrl && ' · '}
              <a href={codeUrl} target="_blank" rel="noreferrer" onClick={stopPropagation}>code</a>
            </>
          )}
        </td>
        <td className="text-right">
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
              <TestHistoryPanel entry={trends?.[test.n] ?? null} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
