import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { NormalizedRunRecord } from '@actions-insights/history-models';
import { CODE_TO_OUTCOME } from '@actions-insights/history-models';
import { loadBranchHistory, loadRun } from '../data/loader';
import { useRepositoryTestTrends } from '../hooks/useRepositoryTestTrends';
import { formatDate, formatDuration, statusIcon } from '../utils/format';
import { AppShell } from '../components/layout/AppShell';
import { PageHeader } from '../components/ui/PageHeader';
import { TabBar } from '../components/ui/TabBar';
import { RunSummaryPanel } from '../components/run/RunSummaryPanel';
import { RunTestsPanel } from '../components/run/RunTestsPanel';

type RunTab = 'summary' | 'tests';

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { trends } = useRepositoryTestTrends(repoKey);

  const activeTab = (searchParams.get('tab') === 'tests' ? 'tests' : 'summary') as RunTab;

  const setActiveTab = (tab: RunTab) => {
    setSearchParams(tab === 'summary' ? {} : { tab }, { replace: true });
  };

  useEffect(() => {
    if (!repoKey || !branchKey || !runId) return;
    let cancelled = false;
    (async () => {
      try {
        const branchHistory = await loadBranchHistory(repoKey, branchKey);
        const summary = branchHistory.runs.find((r) => r.runId === runId);
        if (!summary) throw new Error(`Run ${runId} not found`);
        const record = await loadRun(repoKey, branchKey, summary.runFile);
        if (!cancelled) {
          setRun(record);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [repoKey, branchKey, runId]);

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

  if (loading) return <AppShell><p className="muted">Loading run…</p></AppShell>;
  if (error || !run) return <AppShell><p className="error">{error ?? 'Run not found'}</p></AppShell>;

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'tests', label: `All Tests (${run.stats.total})` },
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
          expanded={expanded}
          onToggleFailure={toggleExpanded}
          slowTests={slowTests}
        />
      ) : (
        <RunTestsPanel
          tests={run.tests}
          totalCount={run.stats.total}
          trends={trends}
          repository={run.context.repository}
          workflowUrl={run.links.workflowUrl}
          jobUrl={run.links.jobUrl}
          slowThreshold={slowThreshold}
        />
      )}
    </AppShell>
  );
}
