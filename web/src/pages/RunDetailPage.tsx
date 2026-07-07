import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RunRecord } from '@actions-insights/history-models';
import { CODE_TO_OUTCOME } from '@actions-insights/history-models';
import { loadBranchHistory, loadRun } from '../data/loader';
import { formatDate, formatDuration, outcomeIcon, shortTestName, statusIcon } from '../utils/format';
import { Layout } from '../components/Layout';

export function RunDetailPage() {
  const { repoKey, branchKey: rawBranchKey, runId } = useParams<{
    repoKey: string;
    branchKey: string;
    runId: string;
  }>();
  const branchKey = rawBranchKey ? decodeURIComponent(rawBranchKey) : '';
  const navigate = useNavigate();
  const [run, setRun] = useState<RunRecord | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'failed' | 'passed' | 'skipped'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!repoKey || !branchKey || !runId) return;
    let cancelled = false;
    (async () => {
      try {
        const history = await loadBranchHistory(repoKey, branchKey);
        const summary = history.runs.find((r) => r.runId === runId);
        if (!summary) throw new Error(`Run ${runId} not found`);
        const record = await loadRun(repoKey, branchKey, summary.runFile);
        if (!cancelled) setRun(record);
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

  const virtualizer = useVirtualizer({
    count: filteredTests.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const failures = run?.failures ?? [];
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

  return (
    <Layout>
      <div className="page-header">
        <button type="button" className="link-btn" onClick={() => navigate(`/r/${repoKey}/b/${encodeURIComponent(branchKey)}`)}>
          ← Branch
        </button>
        <h1>Run #{run.workflowRunId}</h1>
        <p className="muted">
          {statusIcon(run.status)} {run.context.branchLabel} · {formatDate(run.date)} · {formatDuration(run.durationMs)}
        </p>
        <div className="link-row">
          <a href={run.links.workflowUrl} target="_blank" rel="noreferrer">Workflow</a>
          <a href={run.links.commitUrl} target="_blank" rel="noreferrer">Commit {run.context.commitShortSha}</a>
          {run.links.prUrl && <a href={run.links.prUrl} target="_blank" rel="noreferrer">Pull request</a>}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{run.stats.total}</div></div>
        <div className="stat-card"><div className="stat-label">Passed</div><div className="stat-value">✅ {run.stats.passed}</div></div>
        <div className="stat-card"><div className="stat-label">Failed</div><div className="stat-value">❌ {run.stats.failed}</div></div>
        <div className="stat-card"><div className="stat-label">Skipped</div><div className="stat-value">⏭ {run.stats.skipped}</div></div>
      </div>

      {failures.length > 0 && (
        <section className="section">
          <h2>Failed tests ({failures.length})</h2>
          {failures.map((f) => (
            <div key={f.fullName} className="failure-card">
              <button
                type="button"
                className="failure-header"
                aria-expanded={expanded.has(f.fullName)}
                onClick={() => toggleExpanded(f.fullName)}
              >
                <span>❌ {f.fullName}</span>
              </button>
              {expanded.has(f.fullName) && (
                <div className="failure-body">
                  {f.message && <pre>{f.message}</pre>}
                  {f.stackTrace && <pre>{f.stackTrace}</pre>}
                  {f.stdout && <details><summary>stdout</summary><pre>{f.stdout}</pre></details>}
                  {f.stderr && <details><summary>stderr</summary><pre>{f.stderr}</pre></details>}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {slowTests.length > 0 && (
        <section className="section">
          <h2>Slow tests</h2>
          <ul className="simple-list">
            {slowTests.map((t) => (
              <li key={t.n}>⏱ {shortTestName(t.n)} — {formatDuration(t.d)}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <h2>All tests ({filteredTests.length})</h2>
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search tests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tests"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter tests">
            <option value="all">All</option>
            <option value="failed">Failed</option>
            <option value="passed">Passed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>

        <div className="virtual-list" ref={listRef}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((item) => {
              const test = filteredTests[item.index];
              return (
                <div
                  key={test.n}
                  className="test-row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: item.size,
                    transform: `translateY(${item.start}px)`,
                  }}
                >
                  <span>{outcomeIcon(test.o)}</span>
                  <span className="test-name">{test.n}</span>
                  <span className="muted">{formatDuration(test.d)}</span>
                  {test.nf && <span className="badge">new</span>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
