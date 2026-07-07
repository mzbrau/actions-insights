import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BranchHistory, BranchLatest } from '@actions-insights/history-models';
import { loadBranchHistory, loadBranchLatest } from '../data/loader';
import { formatDate, formatDuration, passRate, statusIcon } from '../utils/format';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusBanner } from '../components/ui/StatusBanner';
import { ChartCard } from '../components/ui/ChartCard';
import { DurationTrendChart } from '../components/charts/DurationTrendChart';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { Sparkline } from '../components/charts/Sparkline';

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

  const passRateTrend = useMemo(() => {
    return chartPoints.map((r) => passRate(r.passed, r.total));
  }, [chartPoints]);

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

  const bannerTitle = latest.status === 'passed' ? '✅ PASSING' : '❌ FAILING';
  const bannerSubtitle = `Latest run · ${formatDuration(latest.durationMs)} · ${latest.commitShortSha} by ${latest.author}`;

  return (
    <Layout>
      <PageHeader
        backLabel="Repository"
        onBack={() => navigate(`/r/${repoKey}`)}
        title={history.branchLabel}
        meta={
          <>
            <span>{statusIcon(latest.status)} Latest</span>
            <span>{formatDuration(latest.durationMs)}</span>
            <span>{latest.commitShortSha} by {latest.author}</span>
          </>
        }
      />

      <StatusBanner status={latest.status} title={bannerTitle} subtitle={bannerSubtitle} />

      <div className="stats-grid">
        <StatCard label="Status" value={<>{statusIcon(latest.status)} {latest.status}</>} />
        <StatCard label="Pass rate (avg)" value={`${avgPassRate}%`} />
        <StatCard label="Duration (avg)" value={formatDuration(avgDuration)} />
        <StatCard label="Runs" value={history.runs.length} />
        {passRateTrend.length > 1 && (
          <StatCard
            label="Pass rate trend"
            value={<Sparkline values={passRateTrend} color="var(--primary-container)" />}
          />
        )}
      </div>

      {chartPoints.length > 0 && (
        <div className="charts-row">
          <ChartCard title="Duration Trend">
            <DurationTrendChart
              runs={chartPoints}
              onBarClick={(id) => navigate(`/r/${repoKey}/b/${encodeURIComponent(branchKey)}/run/${id}`)}
            />
          </ChartCard>
          <ChartCard title="Pass / Fail per Run">
            <StackedBarChart runs={chartPoints} />
          </ChartCard>
        </div>
      )}

      <section className="section">
        <h2 className="section-title">Recent runs</h2>
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
