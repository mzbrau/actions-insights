import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { CoverageRunRecord, NormalizedRunRecord, RunSummary } from '@actions-insights/history-models';
import { CODE_TO_OUTCOME } from '@actions-insights/history-models';
import { loadBranchHistory, loadRun, loadRunCoverage } from '../data/loader';
import { useRepositoryTestTrends } from '../hooks/useRepositoryTestTrends';
import { formatDate, formatDuration, statusIcon } from '../utils/format';
import { AppShell } from '../components/layout/AppShell';
import { PageHeader } from '../components/ui/PageHeader';
import { TabBar } from '../components/ui/TabBar';
import { RunSummaryPanel } from '../components/run/RunSummaryPanel';
import { RunTestsPanel } from '../components/run/RunTestsPanel';
import { RunCoveragePanel } from '../components/run/RunCoveragePanel';

type RunTab = 'summary' | 'tests' | 'coverage';

export function RunDetailPage() {
  const { repoKey, branchKey: rawBranchKey, runId } = useParams<{
    repoKey: string;
    branchKey: string;
    runId: string;
  }>();
  const branchKey = rawBranchKey ? decodeURIComponent(rawBranchKey) : '';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [run, setRun] = useState<NormalizedRunRecord | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [branchHistory, setBranchHistory] = useState<RunSummary[]>([]);
  const [coverage, setCoverage] = useState<CoverageRunRecord | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { trends } = useRepositoryTestTrends(repoKey);

  const activeTab = useMemo((): RunTab => {
    const tab = searchParams.get('tab');
    if (tab === 'tests' || tab === 'coverage') return tab;
    return 'summary';
  }, [searchParams]);

  const setActiveTab = (tab: RunTab) => {
    setSearchParams(tab === 'summary' ? {} : { tab }, { replace: true });
  };

  useEffect(() => {
    if (!repoKey || !branchKey || !runId) return;
    let cancelled = false;
    (async () => {
      try {
        const history = await loadBranchHistory(repoKey, branchKey);
        const summary = history.runs.find((r) => r.runId === runId);
        if (!summary) throw new Error(`Run ${runId} not found`);
        const record = await loadRun(repoKey, branchKey, summary.runFile);
        if (!cancelled) {
          setRun(record);
          setRunSummary(summary);
          setBranchHistory(history.runs);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [repoKey, branchKey, runId]);

  useEffect(() => {
    if (activeTab !== 'coverage' || !repoKey || !branchKey || !runSummary?.coverageFile) {
      return;
    }
    if (coverage) return;
    let cancelled = false;
    setCoverageLoading(true);
    loadRunCoverage(repoKey, branchKey, runSummary.coverageFile)
      .then((data) => {
        if (!cancelled) setCoverage(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setCoverageLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTab, repoKey, branchKey, runSummary, coverage]);

  const slowThreshold = 1000;

  const slowTests = useMemo(() => {
    if (!run) return [];
    return run.tests
      .filter((t) => t.d >= slowThreshold && CODE_TO_OUTCOME[t.o] === 'passed')
      .sort((a, b) => b.d - a.d)
      .slice(0, 18);
  }, [run]);

  const toggleExpanded = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const dashboardUrl = `/r/${repoKey}?branch=${encodeURIComponent(branchKey)}`;
  const hasCoverage = Boolean(runSummary?.coverage?.line !== undefined);

  if (loading) return <AppShell><p className="muted">Loading run…</p></AppShell>;
  if (error || !run || !runSummary) return <AppShell><p className="error">{error ?? 'Run not found'}</p></AppShell>;

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'tests', label: `All Tests (${run.stats.total})` },
    ...(hasCoverage ? [{ id: 'coverage', label: 'Test Coverage' }] : []),
  ];

  return (
    <AppShell>
      <PageHeader
        backLabel="Dashboard"
        onBack={() => navigate(dashboardUrl)}
        title={`Run #${run.workflowRunId}`}
        meta={
          <>
            <span>{statusIcon(run.status)} {run.context.branchLabel}</span>
            <span>{formatDate(run.date)}</span>
            <span>{formatDuration(run.durationMs)}</span>
          </>
        }
        actions={
          <>
            <a href={run.links.workflowUrl} target="_blank" rel="noreferrer" className="btn btn-primary">Workflow</a>
            <a href={run.links.commitUrl} target="_blank" rel="noreferrer" className="btn">Commit {run.context.commitShortSha}</a>
            {run.links.prUrl && (
              <a href={run.links.prUrl} target="_blank" rel="noreferrer" className="btn">Pull request</a>
            )}
          </>
        }
      />

      <TabBar tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as RunTab)} />

      {activeTab === 'summary' ? (
        <RunSummaryPanel
          run={run}
          runSummary={runSummary}
          branchHistory={branchHistory}
          expanded={expanded}
          onToggleFailure={toggleExpanded}
          slowTests={slowTests}
        />
      ) : activeTab === 'coverage' ? (
        coverageLoading ? (
          <p className="muted">Loading coverage…</p>
        ) : coverage ? (
          <RunCoveragePanel coverage={coverage} />
        ) : (
          <p className="chart-empty">Coverage data unavailable.</p>
        )
      ) : (
        <RunTestsPanel
          tests={run.tests}
          totalCount={run.stats.total}
          trends={trends}
          repository={run.context.repository}
          repoKey={repoKey}
          workflowUrl={run.links.workflowUrl}
          jobUrl={run.links.jobUrl}
          slowThreshold={slowThreshold}
        />
      )}
    </AppShell>
  );
}
