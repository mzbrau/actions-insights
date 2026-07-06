import type { ThemeMode } from '../../config';
import type { BranchManifest, RunManifestEntry, TrendData } from '../../model/manifest';
import type { TestRun } from '../../model/test-run';
import { formatDuration } from '../../model/test-run';
import { escapeHtml } from '../escape';
import { renderLayout } from '../layout';

function renderSparkline(points: TrendData['points']): string {
  if (points.length === 0) return '';
  const max = Math.max(...points.map((p) => p.passed + p.failed), 1);
  return `<span class="sparkline">${points.slice(-12).map((p) => {
    const h = Math.max(4, Math.round(((p.passed + p.failed) / max) * 24));
    const cls = p.failed > 0 ? 'fail' : 'pass';
    return `<span class="${cls}" style="height:${h}px"></span>`;
  }).join('')}</span>`;
}

function renderRunRow(run: RunManifestEntry, pagesBaseUrl?: string): string {
  const url = pagesBaseUrl ? `${pagesBaseUrl}/${run.path}index.html` : `${run.path}index.html`;
  const statusClass = run.status === 'passed' ? 'passed' : 'failed';
  return `<tr class="${run.status === 'failed' ? 'failed' : ''}">
    <td><span class="status-pill ${statusClass}">${run.status === 'passed' ? '✓' : '✗'} ${escapeHtml(run.status)}</span></td>
    <td><a href="${escapeHtml(url)}">Run ${escapeHtml(run.runId)}</a></td>
    <td>${escapeHtml(new Date(run.date).toLocaleString())}</td>
    <td><span style="color:var(--primary)">● ${run.passed}</span> <span style="color:var(--error)">● ${run.failed}</span> <span style="color:var(--tertiary)">● ${run.skipped}</span></td>
    <td><code class="commit-chip">${escapeHtml(run.commitShortSha)}</code> ${escapeHtml(run.author)}</td>
    <td>${formatDuration(run.durationMs)}</td>
  </tr>`;
}

export function renderBranchHistoryPage(
  run: TestRun,
  reportTitle: string,
  theme: ThemeMode,
  manifest: BranchManifest,
  trend: TrendData,
  pagesBaseUrl?: string,
): string {
  const body = `
<div class="section">
  <div class="breadcrumbs"><a href="../../index.html">Reports</a> › ${escapeHtml(manifest.label)} › History</div>
  <div class="section-header">
    <h1 class="section-title">Report History</h1>
    <span style="color:var(--on-surface-variant)">${escapeHtml(manifest.label)}</span>
  </div>
  <div class="history-stats">
    <div class="summary-card"><div class="bar success"></div><div class="body"><div class="label">Avg Pass Rate</div><div class="value">${trend.averagePassRate}%</div></div></div>
    <div class="summary-card"><div class="bar neutral"></div><div class="body"><div class="label">Mean Duration</div><div class="value">${formatDuration(trend.averageDurationMs)}</div></div></div>
    <div class="summary-card"><div class="bar error"></div><div class="body"><div class="label">Failures (24h)</div><div class="value">${trend.failuresLast24h}</div></div></div>
    <div class="summary-card"><div class="bar neutral"></div><div class="body"><div class="label">Total Runs</div><div class="value">${trend.totalRuns}</div></div></div>
  </div>
  <div style="margin-bottom:16px">${renderSparkline(trend.points)}</div>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead>
        <tr><th>Status</th><th>Run</th><th>Date</th><th>Summary</th><th>Commit</th><th>Duration</th></tr>
      </thead>
      <tbody>${manifest.runs.map((r) => renderRunRow(r, pagesBaseUrl)).join('')}</tbody>
    </table>
  </div>
</div>`;

  return renderLayout({
    title: 'History',
    reportTitle,
    activeNav: 'history',
    run,
    theme,
  }, body);
}

export function renderSiteIndex(
  reportTitle: string,
  repository: string,
  branches: BranchManifest[],
  pagesBaseUrl?: string,
): string {
  const rows = branches.map((branch) => {
    const latest = branch.runs.find((r) => r.isLatest) ?? branch.runs[0];
    const url = pagesBaseUrl
      ? `${pagesBaseUrl}/${branch.latestPath}index.html`
      : `${branch.latestPath}index.html`;
    const status = latest?.status ?? 'passed';
    return `<tr>
      <td><span class="status-pill ${status}">${escapeHtml(status)}</span></td>
      <td><a href="${escapeHtml(url)}">${escapeHtml(branch.label)}</a> <span style="color:var(--on-surface-variant)">(${branch.type})</span></td>
      <td>${branch.runs.length}</td>
      <td>${latest ? escapeHtml(new Date(latest.date).toLocaleString()) : '—'}</td>
      <td>${latest ? `${latest.passed}/${latest.total}` : '—'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(reportTitle)} — Reports</title>
<link rel="stylesheet" href="assets/tokens.css"/><link rel="stylesheet" href="assets/report.css"/>
</head><body>
<div class="app-shell">
<header class="top-nav"><div class="brand">${escapeHtml(reportTitle)}</div></header>
<main class="main-content section">
<h1 class="section-title">Test Reports — ${escapeHtml(repository)}</h1>
<div class="data-table-wrap"><table class="data-table">
<thead><tr><th>Status</th><th>Branch / PR / Tag</th><th>Runs</th><th>Latest</th><th>Summary</th></tr></thead>
<tbody>${rows || '<tr><td colspan="5" class="empty-state">No reports yet</td></tr>'}</tbody>
</table></div>
</main></div></body></html>`;
}
