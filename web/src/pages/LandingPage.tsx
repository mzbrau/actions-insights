import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RepositoryIndexEntry } from '@actions-insights/history-models';
import { loadConfig, loadRepositoriesIndex } from '../data/loader';
import { formatDate, statusIcon } from '../utils/format';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { DonutChart } from '../components/charts/DonutChart';
import { ChartCard } from '../components/ui/ChartCard';
import { FilterChips } from '../components/ui/FilterChips';

type SortKey = 'name' | 'status' | 'branches' | 'updated';

const SORT_OPTIONS = [
  { value: 'updated' as const, label: 'Recently updated' },
  { value: 'name' as const, label: 'Name' },
  { value: 'status' as const, label: 'Status' },
  { value: 'branches' as const, label: 'Branch count' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<RepositoryIndexEntry[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [index, config] = await Promise.all([loadRepositoriesIndex(), loadConfig()]);
        if (cancelled) return;

        if (index.repositories.length === 1) {
          navigate(`/r/${index.repositories[0].key}`, { replace: true });
          return;
        }
        if (config.defaultRepository) {
          const key = config.defaultRepository.replace('/', '.');
          if (index.repositories.some((r) => r.key === key)) {
            navigate(`/r/${key}`, { replace: true });
            return;
          }
        }

        setRepos(index.repositories);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('repo-search')?.focus();
      }
      if (e.key === 'g') {
        (window as Window & { _gPending?: boolean })._gPending = true;
        setTimeout(() => { (window as Window & { _gPending?: boolean })._gPending = false; }, 500);
      } else if (e.key === 'r' && (window as Window & { _gPending?: boolean })._gPending) {
        navigate('/');
        (window as Window & { _gPending?: boolean })._gPending = false;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const filtered = repos
    .filter((r) => {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.key.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.latestStatus.localeCompare(b.latestStatus);
        case 'branches':
          return b.branchCount - a.branchCount;
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });

  const healthStats = useMemo(() => {
    const passing = repos.filter((r) => r.latestStatus === 'passed').length;
    const failing = repos.filter((r) => r.latestStatus === 'failed').length;
    return { total: repos.length, passing, failing };
  }, [repos]);

  if (loading) return <Layout><p className="muted">Loading repositories…</p></Layout>;
  if (error) return <Layout><p className="error">{error}</p></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Repositories"
        meta={<span>Test history across all connected projects</span>}
      />

      <div className="stats-grid">
        <StatCard label="Repositories" value={healthStats.total} />
        <StatCard label="Passing" value={healthStats.passing} variant="passed" />
        <StatCard label="Failing" value={healthStats.failing} variant="failed" />
      </div>

      {healthStats.total > 0 && (
        <div className="charts-row">
          <ChartCard title="Repository Health">
            <DonutChart passed={healthStats.passing} failed={healthStats.failing} skipped={0} />
          </ChartCard>
        </div>
      )}

      <div className="toolbar">
        <input
          id="repo-search"
          type="search"
          className="search-input"
          placeholder="Search repositories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search repositories"
        />
        <FilterChips options={SORT_OPTIONS} value={sort} onChange={setSort} ariaLabel="Sort repositories" />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Repository</th>
            <th>Branches</th>
            <th>Last build</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((repo) => (
            <tr key={repo.key} className="clickable" onClick={() => navigate(`/r/${repo.key}`)}>
              <td>{statusIcon(repo.latestStatus)}</td>
              <td>
                <strong>{repo.name}</strong>
                <div className="muted small">{repo.latestCommitShortSha}</div>
              </td>
              <td>{repo.branchCount}</td>
              <td>{statusIcon(repo.latestStatus)}</td>
              <td>{formatDate(repo.lastUpdated)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && <p className="empty-state">No repositories match your search.</p>}
    </Layout>
  );
}
