import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BranchIndexEntry } from '@actions-insights/history-models';
import { loadRepository } from '../data/loader';
import { formatDate, formatDuration, statusIcon } from '../utils/format';
import { Layout } from '../components/Layout';

type StatusFilter = 'all' | 'passed' | 'failed';

export function RepositoryPage() {
  const { repoKey } = useParams<{ repoKey: string }>();
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState<Awaited<ReturnType<typeof loadRepository>>['metadata'] | null>(null);
  const [branches, setBranches] = useState<BranchIndexEntry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoKey) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await loadRepository(repoKey);
        if (!cancelled) {
          setMetadata(data.metadata);
          setBranches(data.branches.branches);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [repoKey]);

  const filtered = useMemo(() => {
    return branches
      .filter((b) => {
        if (statusFilter !== 'all' && b.latestStatus !== statusFilter) return false;
        const q = search.toLowerCase();
        return b.label.toLowerCase().includes(q) || b.key.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
  }, [branches, search, statusFilter]);

  if (loading) return <Layout><p className="muted">Loading repository…</p></Layout>;
  if (error || !metadata) return <Layout><p className="error">{error ?? 'Repository not found'}</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <button type="button" className="link-btn" onClick={() => navigate('/')}>← All repositories</button>
        <h1>{metadata.name}</h1>
        <p className="muted">
          {statusIcon(metadata.latestStatus)} Overall health · {metadata.branchCount} branches · Updated {formatDate(metadata.lastRunDate)}
        </p>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search branches…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search branches"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Branch</th>
            <th>Duration</th>
            <th>Commit</th>
            <th>Author</th>
            <th>Date</th>
            <th>Runs</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((branch) => (
            <tr key={branch.key} className="clickable" onClick={() => navigate(`/r/${repoKey}/b/${encodeURIComponent(branch.key)}`)}>
              <td>{statusIcon(branch.latestStatus)}</td>
              <td>
                <Link to={`/r/${repoKey}/b/${encodeURIComponent(branch.key)}`} onClick={(e) => e.stopPropagation()}>
                  {branch.label}
                </Link>
                <div className="muted small">{branch.type}</div>
              </td>
              <td>{formatDuration(branch.latestDurationMs)}</td>
              <td><code>{branch.latestCommitShortSha}</code></td>
              <td>{branch.latestAuthor}</td>
              <td>{formatDate(branch.latestDate)}</td>
              <td>{branch.runCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
