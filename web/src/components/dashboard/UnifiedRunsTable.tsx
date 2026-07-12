import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { formatDateWithRelative, formatDuration, statusIcon } from '../../utils/format';

const PAGE_SIZE = 25;

interface UnifiedRunsTableProps {
  runs: EnrichedRun[];
  search: string;
}

export function UnifiedRunsTable({ runs, search }: UnifiedRunsTableProps) {
  const { repoKey } = useParams<{ repoKey: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [search, runs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return runs;
    return runs.filter((r) =>
      r.branchLabel.toLowerCase().includes(q)
      || String(r.workflowRunId).includes(q)
      || r.commitShortSha.toLowerCase().includes(q)
      || r.commitMessage.toLowerCase().includes(q)
      || r.author.toLowerCase().includes(q),
    );
  }, [runs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRuns = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const goToRun = (run: EnrichedRun) => {
    if (!repoKey) return;
    navigate(`/r/${repoKey}/b/${encodeURIComponent(run.branchKey)}/run/${run.runId}`);
  };

  return (
    <section className="unified-runs-section">
      <div className="unified-runs-header">
        <h3 className="section-title">Unified Run History</h3>
        <span className="muted small">
          {filtered.length} run{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="unified-runs-table-wrap">
        <table className="data-table unified-runs-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Run</th>
              <th>Branch/PR</th>
              <th>Duration</th>
              <th>Commit</th>
              <th>Author</th>
              <th className="text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {pageRuns.map((run) => (
              <tr key={`${run.branchKey}-${run.runId}`} className="clickable" onClick={() => goToRun(run)}>
                <td>
                  <span className={`run-status run-status-${run.status}`}>
                    {statusIcon(run.status)} {run.status}
                  </span>
                </td>
                <td className="mono">#{run.workflowRunId}</td>
                <td>
                  <span className={`branch-pill${run.branchType === 'pr' ? ' pr' : ''}`}>
                    {run.branchLabel}
                  </span>
                </td>
                <td>{formatDuration(run.durationMs)}</td>
                <td>
                  <code>{run.commitShortSha}</code>
                  <div className="muted small commit-msg">{run.commitMessage}</div>
                </td>
                <td>{run.author}</td>
                <td className="text-right small">{formatDateWithRelative(run.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="empty-state">No runs match your filters.</p>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="pagination">
          <span className="muted small">
            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
