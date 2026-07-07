import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { BranchHistory, RunRecord } from '@actions-insights/history-models';
import { CODE_TO_OUTCOME } from '@actions-insights/history-models';
import { loadBranchHistory, loadRun } from '../data/loader';
import { formatDate, formatDuration, statusIcon } from '../utils/format';
import { Layout } from '../components/Layout';
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
  const [run, setRun] = useState<RunRecord | null>(null);
  const [history, setHistory] = useState<BranchHistory | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'failed' | 'passed' | 'skipped'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setHistory(branchHistory);
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

  const filteredTests = useMemo(() => {
    if (!run) return [];
    const q = search.toLowerCase();
    return run.tests.filter((t) => {
      const outcome = CODE_TO_OUTCOME[t.o] ?? 'inconclusive';
      if (filter === 'failed' && outcome !== 'failed') return false;
      if (filter === 'passed' && outcome !== 'passed') return false;
      if (filter === 'skipped' && outcome !== 'skipped') return false;
      if (q && !t.n.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [run, search, filter]);

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

  if (loading) return <Layout><p className="muted">Loading run…</p></Layout>;
  if (error || !run) return <Layout><p className="error">{error ?? 'Run not found'}</p></Layout>;

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'tests', label: `All Tests (${run.stats.total})` },
  ];

  return (
    <Layout>
      <PageHeader
        backLabel="Branch"
        onBack={() => navigate(`/r/${repoKey}/b/${encodeURIComponent(branchKey)}`)}
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
          history={history}
          expanded={expanded}
          onToggleFailure={toggleExpanded}
          slowTests={slowTests}
        />
      ) : (
        <RunTestsPanel
          tests={filteredTests}
          totalCount={filteredTests.length}
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />
      )}
    </Layout>
  );
}
