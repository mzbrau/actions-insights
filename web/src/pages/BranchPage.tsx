import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BranchHistory, BranchLatest } from '@actions-insights/history-models';
import { loadBranchHistory, loadBranchLatest } from '../data/loader';
import { formatDate, formatDuration, passRate, statusIcon } from '../utils/format';
import { Layout } from '../components/Layout';

export function BranchPage() {
  const { repoKey, branchKey: rawBranchKey } = useParams<{ repoKey: string; branchKey: string }>();
  const branchKey = rawBranchKey ? decodeURIComponent(rawBranchKey) : '';
  const navigate = useNavigate();
  const [latest, setLatest] = useState<BranchLatest | null>(null);
  const [history, setHistory] = useState<BranchHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoKey || !branchKey) return;
    let cancelled = false;
    (async () => {
      try {
        const [l, h] = await Promise.all([
          loadBranchLatest(repoKey, branchKey),
          loadBranchHistory(repoKey, branchKey),
        ]);
        if (!cancelled) {
          setLatest(l);
          setHistory(h);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [repoKey, branchKey]);

  const chartPoints = useMemo(() => {
    if (!history) return [];
    return [...history.runs].reverse().slice(-20);
  }, [history]);

  const avgPassRate = useMemo(() => {
    if (!history?.runs.length) return 0;
    const sum = history.runs.reduce((acc, r) => acc + passRate(r.passed, r.total), 0);
    return Math.round((sum / history.runs.length) * 10) / 10;
  }, [history]);

  const avgDuration = useMemo(() => {
    if (!history?.runs.length) return 0;
    return Math.round(history.runs.reduce((acc, r) => acc + r.durationMs, 0) / history.runs.length);
  }, [history]);

  if (loading) return <Layout><p className="muted">Loading branch…</p></Layout>;
  if (error || !latest || !history) return <Layout><p className="error">{error ?? 'Branch not found'}</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <button type="button" className="link-btn" onClick={() => navigate(`/r/${repoKey}`)}>← Repository</button>
        <h1>{history.branchLabel}</h1>
        <p className="muted">
          {statusIcon(latest.status)} Latest · {formatDuration(latest.durationMs)} · {latest.commitShortSha} by {latest.author}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className="stat-value">{statusIcon(latest.status)} {latest.status}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pass rate (avg)</div>
          <div className="stat-value">{avgPassRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Duration (avg)</div>
          <div className="stat-value">{formatDuration(avgDuration)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Runs</div>
          <div className="stat-value">{history.runs.length}</div>
        </div>
      </div>

      {chartPoints.length > 0 && (
        <section className="section">
          <h2>Duration trend</h2>
          <div className="bar-chart" role="img" aria-label="Duration trend chart">
            {chartPoints.map((point) => {
              const max = Math.max(...chartPoints.map((p) => p.durationMs), 1);
              const height = Math.max(4, Math.round((point.durationMs / max) * 100));
              return (
                <div
                  key={point.runId}
                  className={`bar ${point.status}`}
                  style={{ height: `${height}%` }}
                  title={`${formatDate(point.date)}: ${formatDuration(point.durationMs)}`}
                />
              );
            })}
          </div>
        </section>
      )}

      <section className="section">
        <h2>Recent runs</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Run</th>
              <th>Tests</th>
              <th>Duration</th>
              <th>Commit</th>
              <th>Author</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.runs.map((run) => (
              <tr
                key={run.runId}
                className="clickable"
                onClick={() => navigate(`/r/${repoKey}/b/${encodeURIComponent(branchKey)}/run/${run.runId}`)}
              >
                <td>{statusIcon(run.status)}</td>
                <td>
                  <Link
                    to={`/r/${repoKey}/b/${encodeURIComponent(branchKey)}/run/${run.runId}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    #{run.workflowRunId}
                  </Link>
                </td>
                <td>{run.passed}/{run.total} ({passRate(run.passed, run.total)}%)</td>
                <td>{formatDuration(run.durationMs)}</td>
                <td><code>{run.commitShortSha}</code></td>
                <td>{run.author}</td>
                <td>{formatDate(run.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  );
}
