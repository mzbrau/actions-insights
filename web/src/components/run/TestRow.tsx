import type { CompactTestRecord, TestHistoryEntry } from '@actions-insights/history-models';
import { formatDuration, outcomeIcon } from '../../utils/format';
import {
  buildCodeSearchUrl,
  getClassName,
  getPassRateFromTrends,
  getShortName,
} from '../../utils/testList';
import { CopyTestNameButton } from '../ui/CopyTestNameButton';
import { TestHistoryPanel } from './TestHistoryPanel';

const COL_SPAN = 7;

interface TestRowProps {
  test: CompactTestRecord;
  repository: string;
  repoKey?: string;
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
  repoKey,
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
        <td className="tests-col-status">
          <span className="test-outcome">{outcomeIcon(test.o)}</span>
        </td>
        <td className="tests-col-name">
          <span className="test-name" title={test.n}>{getShortName(test)}</span>
          <CopyTestNameButton fullName={test.n} />
        </td>
        <td className="tests-col-class test-class-cell">
          {!hideClass && <span className="test-class mono small" title={cls}>{cls}</span>}
        </td>
        <td className="tests-col-duration">{formatDuration(test.d)}</td>
        <td className="tests-col-passrate">{pr ? `${pr.rate}%` : '—'}</td>
        <td className="tests-col-links test-links-cell">
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
              <TestHistoryPanel entry={trends?.[test.n] ?? null} repoKey={repoKey} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
