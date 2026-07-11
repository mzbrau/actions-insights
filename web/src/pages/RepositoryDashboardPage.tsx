import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { BranchIndexEntry } from '@actions-insights/history-models';
import { loadRepository } from '../data/loader';
import { useRepositoryRuns } from '../hooks/useRepositoryRuns';
import { formatDuration, statusIcon } from '../utils/format';
import { AppShell } from '../components/layout/AppShell';
import { DashboardTopBar } from '../components/layout/DashboardTopBar';
import { BranchFilterBar } from '../components/dashboard/BranchFilterBar';
import { ProblematicTestsPanel } from '../components/dashboard/ProblematicTestsPanel';
import { TrendsPanel } from '../components/dashboard/TrendsPanel';
import { QuickStatsPanel } from '../components/dashboard/QuickStatsPanel';
import { UnifiedRunsTable } from '../components/dashboard/UnifiedRunsTable';
import { PassRateRing } from '../components/charts/PassRateRing';
import { DurationTrendChart } from '../components/charts/DurationTrendChart';
import { ChartCard } from '../components/ui/ChartCard';
import { TabBar } from '../components/ui/TabBar';
import { CoverageTrendsPanel } from '../components/dashboard/CoverageTrendsPanel';
import { BuildInsightsPanel } from '../components/dashboard/BuildInsightsPanel';

type DashboardTab = 'builds' | 'problematic-tests' | 'trends' | 'coverage' | 'build-insights';

export function RepositoryDashboardPage() {
  const { repoKey } = useParams<{ repoKey: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const branchFilter = searchParams.get('branch') ?? '';
  const activeTab = useMemo((): DashboardTab => {
    const tab = searchParams.get('tab');
    if (tab === 'problematic-tests' || tab === 'trends' || tab === 'coverage' || tab === 'build-insights') return tab;
    return 'builds';
  }, [searchParams]);
  const [search, setSearch] = useState('');
  const [metadata, setMetadata] = useState<Awaited<ReturnType<typeof loadRepository>>['metadata'] | null>(null);
  const [branches, setBranches] = useState<BranchIndexEntry[]>([]);
  const [repoLoading, setRepoLoading] = useState(true);
  const [repoError, setRepoError] = useState<string | null>(null);

  const { runs, metrics, loading: runsLoading, error: runsError } = useRepositoryRuns(
    repoKey,
    branchFilter || undefined,
  );

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
        if (!cancelled) setRepoError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setRepoLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [repoKey]);

  const chartRuns = useMemo(() => runs.slice(0, 20).reverse(), [runs]);
  const trendRuns = useMemo(() => [...runs].reverse().slice(-30), [runs]);

  const setBranchFilter = (branchKey: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (branchKey) next.set('branch', branchKey);
      else next.delete('branch');
      return next;
    });
  };

  const setActiveTab = (tab: DashboardTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'builds') next.delete('tab');
      else next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  const loading = repoLoading || runsLoading;
  const error = repoError ?? runsError;

  const dashboardTabs = [
    { id: 'builds', label: 'Builds' },
    { id: 'problematic-tests', label: 'Problematic Tests' },
    { id: 'trends', label: 'Trends' },
    { id: 'coverage', label: 'Test Coverage' },
    { id: 'build-insights', label: 'Build Insights' },
  ];

  if (loading) {
    return (
      <AppShell topBar={<DashboardTopBar search={search} onSearchChange={setSearch} />}>
        <p className="muted">Loading dashboard…</p>
      </AppShell>
    );
  }

  if (error || !metadata) {
    return (
      <AppShell topBar={<DashboardTopBar search={search} onSearchChange={setSearch} />}>
        <p className="error">{error ?? 'Repository not found'}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      topBar={
        <DashboardTopBar
          repoName={metadata.name}
          search={activeTab === 'builds' ? search : ''}
          onSearchChange={setSearch}
        />
      }
    >
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{metadata.name}</h1>
          <p className="muted dashboard-subtitle">Actions workflow monitoring and test analytics.</p>
        </div>
        <div className="health-card">
          <div className="health-card-stat">
            <span className="health-card-label">Overall Health</span>
            <span className="health-card-value passed">
              {statusIcon(metadata.latestStatus)} {metrics.passRate}%
            </span>
          </div>
          <div className="health-card-stat">
            <span className="health-card-label">Branches</span>
            <span className="health-card-value">{metadata.branchCount}</span>
          </div>
        </div>
      </div>

      <TabBar
        tabs={dashboardTabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as DashboardTab)}
        ariaLabel="Repository sections"
      />

      {activeTab === 'builds' && (
        <div className="tab-panel" role="tabpanel">
          <BranchFilterBar
            branches={branches}
            selectedBranch={branchFilter}
            onBranchChange={setBranchFilter}
            lastUpdated={metadata.lastRunDate}
          />

          <div className="metrics-bento">
            <ChartCard title="Pass Rate" compact>
              <PassRateRing passRate={metrics.passRate} fill />
            </ChartCard>

            <ChartCard title="Build Performance" compact>
              <DurationTrendChart
                runs={chartRuns}
                singleBranchView={Boolean(branchFilter)}
                onBarClick={(run) => {
                  if (repoKey) {
                    navigate(`/r/${repoKey}/b/${encodeURIComponent(run.branchKey)}/run/${run.runId}`);
                  }
                }}
              />
            </ChartCard>

            <QuickStatsPanel
              total={metrics.total}
              avgDuration={formatDuration(metrics.avgDurationMs)}
              failRate={`${metrics.failRate}%`}
            />
          </div>

          <UnifiedRunsTable runs={runs} search={search} />
        </div>
      )}

      {activeTab === 'problematic-tests' && repoKey && (
        <ProblematicTestsPanel repoKey={repoKey} />
      )}

      {activeTab === 'trends' && repoKey && (
        <TrendsPanel
          repoKey={repoKey}
          runs={trendRuns}
          singleBranchView={Boolean(branchFilter)}
          branches={branches}
          selectedBranch={branchFilter}
          onBranchChange={setBranchFilter}
          lastUpdated={metadata.lastRunDate}
        />
      )}

      {activeTab === 'coverage' && repoKey && (
        <CoverageTrendsPanel repoKey={repoKey} runs={trendRuns} />
      )}

      {activeTab === 'build-insights' && repoKey && (
        <BuildInsightsPanel repoKey={repoKey} runs={trendRuns} />
      )}
    </AppShell>
  );
}
