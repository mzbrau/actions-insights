import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BranchIndexEntry } from '@actions-insights/history-models';
import { loadRepository } from '../data/loader';
import { formatDate, formatDuration, statusIcon } from '../utils/format';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusBanner } from '../components/ui/StatusBanner';
import { DonutChart } from '../components/charts/DonutChart';
import { ChartCard } from '../components/ui/ChartCard';
import { FilterChips } from '../components/ui/FilterChips';

type StatusFilter = 'all' | 'passed' | 'failed';

const STATUS_FILTERS = [
  { value: 'all' as const, label: 'All' },
  { value: 'passed' as const, label: 'Passed', variant: 'passed' as const },
  { value: 'failed' as const, label: 'Failed', variant: 'failed' as const },
];

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

  const branchStats = useMemo(() => {
    const passing = branches.filter((b) => b.latestStatus === 'passed').length;
    const failing = branches.filter((b) => b.latestStatus === 'failed').length;
    return { passing, failing };
  }, [branches]);

  if (loading) return <Layout><p className="muted">Loading repository…</p></Layout>;
  if (error || !metadata) return <Layout><p className="error">{error ?? 'Repository not found'}</p></Layout>;

  const bannerTitle = metadata.latestStatus === 'passed' ? '✅ HEALTHY' : '❌ NEEDS ATTENTION';
  const bannerSubtitle =
    metadata.latestStatus === 'passed'
      ? `All ${metadata.branchCount} branches passing · Updated ${formatDate(metadata.lastRunDate)}`
      : `${branchStats.failing} branch${branchStats.failing === 1 ? '' : 'es'} failing · Updated ${formatDate(metadata.lastRunDate)}`;

  return (
    <Layout>
      <PageHeader
        backLabel="All repositories"
        onBack={() => navigate('/')}
        title={metadata.name}
        meta={
          <>
            <span>{statusIcon(metadata.latestStatus)} Overall health</span>
            <span>{metadata.branchCount} branches</span>
            <span>Updated {formatDate(metadata.lastRunDate)}</span>
          </>
        }
      />

      <StatusBanner status={metadata.latestStatus} title={bannerTitle} subtitle={bannerSubtitle} />

      <div className="stats-grid">
        <StatCard label="Branches" value={metadata.branchCount} />
        <StatCard label="Passing" value={branchStats.passing} variant="passed" />
        <StatCard label="Failing" value={branchStats.failing} variant="failed" />
      </div>

      {branches.length > 0 && (
        <div className="charts-row">
          <ChartCard title="Branch Health">
            <DonutChart passed={branchStats.passing} failed={branchStats.failing} skipped={0} />
          </ChartCard>
        </div>
      )}

      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Search branches…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search branches"
        />
        <FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} ariaLabel="Filter by status" />
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

      {filtered.length === 0 && <p className="empty-state">No branches match your filters.</p>}
    </Layout>
  );
}
