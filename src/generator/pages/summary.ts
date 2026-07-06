import type { ThemeMode } from '../../config';
import type { TestCase } from '../../model/test-case';
import type { TestRun } from '../../model/test-run';
import { formatDuration } from '../../model/test-run';
import { escapeHtml } from '../escape';
import { renderLayout } from '../layout';

function renderFailure(test: TestCase): string {
  const newClass = test.isNewFailure ? ' new-failure' : '';
  const stack = test.stackTrace
    ? `<div class="code-block"><button class="copy-btn" type="button">Copy</button><pre>${escapeHtml(test.stackTrace)}</pre></div>`
    : '';
  const stdout = test.stdout
    ? `<div class="code-block"><pre>${escapeHtml(test.stdout)}</pre></div>`
    : '';
  const stderr = test.stderr
    ? `<div class="code-block"><pre>${escapeHtml(test.stderr)}</pre></div>`
    : '';
  const location = [test.assembly, test.namespace, test.className].filter(Boolean).join(' · ');

  return `<article class="failure-item critical${newClass}" id="test-${escapeHtml(test.id)}">
    <div class="failure-header">
      <div>
        <div class="failure-name">${escapeHtml(test.fullName)}</div>
        <div class="failure-class">${escapeHtml(location)}</div>
        ${test.message ? `<div class="failure-message">${escapeHtml(test.message)}</div>` : ''}
      </div>
      <span>${formatDuration(test.durationMs)}</span>
    </div>
    <div class="failure-body">
      ${stack}
      ${stdout ? `<p><strong>StdOut</strong></p>${stdout}` : ''}
      ${stderr ? `<p><strong>StdErr</strong></p>${stderr}` : ''}
    </div>
  </article>`;
}

function renderSkipped(test: TestCase): string {
  return `<div class="failure-item" style="opacity:0.8">
    <div class="failure-header">
      <div>
        <div class="failure-name">${escapeHtml(test.fullName)}</div>
        ${test.message ? `<div class="failure-class">${escapeHtml(test.message)}</div>` : ''}
      </div>
    </div>
  </div>`;
}

export function renderSummaryPage(run: TestRun, reportTitle: string, theme: ThemeMode): string {
  const { stats, context: ctx, status } = run;
  const failures = run.tests.filter((t) => t.outcome === 'failed');
  const skipped = run.tests.filter((t) => t.outcome === 'skipped');
  const bannerClass = status === 'passed' ? 'passed' : 'failed';
  const bannerLabel = status === 'passed' ? 'PASSED' : 'FAILED';
  const bannerIcon = status === 'passed' ? '✅' : '❌';
  const bannerDetail =
    status === 'passed'
      ? `All ${stats.total.toLocaleString()} tests passed`
      : `${stats.failed.toLocaleString()} tests failed out of ${stats.total.toLocaleString()} total`;

  const body = `
<div class="status-banner ${bannerClass}">
  <h1>${bannerIcon} ${bannerLabel}</h1>
  <p>${escapeHtml(bannerDetail)}</p>
</div>
<div class="meta-grid">
  <div><div class="meta-label">Repository</div><div class="meta-value"><a href="${escapeHtml(ctx.repositoryUrl)}">${escapeHtml(ctx.repository)}</a></div></div>
  <div><div class="meta-label">Branch</div><div class="meta-value">${escapeHtml(ctx.branch)}</div></div>
  <div><div class="meta-label">PR / Commit</div><div class="meta-value">${ctx.prNumber ? `<a href="${escapeHtml(ctx.prUrl ?? '#')}">#${ctx.prNumber}</a> · ` : ''}<code class="commit-chip">${escapeHtml(ctx.commitShortSha)}</code></div></div>
  <div><div class="meta-label">Author</div><div class="meta-value">${escapeHtml(ctx.author)}</div></div>
  <div><div class="meta-label">Duration</div><div class="meta-value">${formatDuration(stats.durationMs)}</div></div>
  <div><div class="meta-label">Workflow</div><div class="meta-value"><a href="${escapeHtml(ctx.workflowUrl)}">${escapeHtml(ctx.workflow)}</a></div></div>
</div>
<div class="cards-grid">
  <div class="summary-card"><div class="bar neutral"></div><div class="body"><div class="label">Total</div><div class="value">${stats.total.toLocaleString()}</div></div></div>
  <div class="summary-card"><div class="bar success"></div><div class="body"><div class="label">Passed</div><div class="value">${stats.passed.toLocaleString()}</div></div></div>
  <div class="summary-card"><div class="bar error"></div><div class="body"><div class="label">Failed</div><div class="value">${stats.failed.toLocaleString()}</div></div></div>
  <div class="summary-card"><div class="bar warning"></div><div class="body"><div class="label">Skipped</div><div class="value">${stats.skipped.toLocaleString()}</div></div></div>
  <div class="summary-card"><div class="bar neutral"></div><div class="body"><div class="label">Duration</div><div class="value">${formatDuration(stats.durationMs)}</div></div></div>
  <div class="summary-card"><div class="bar ${stats.failed > 0 ? 'error' : 'success'}"></div><div class="body"><div class="label">Success</div><div class="value">${stats.successRate}%</div></div></div>
</div>
<section class="section" id="failures">
  <div class="section-header">
    <h2 class="section-title">Failed Tests (${failures.length})</h2>
    <div class="section-actions">
      <input id="failure-search" class="search-input" type="search" placeholder="Search failures..." style="max-width:280px"/>
      <button id="expand-all-failures" class="btn" type="button">Expand All</button>
    </div>
  </div>
  ${failures.length === 0 ? '<div class="empty-state">No failures — great job!</div>' : `<div class="failure-list">${failures.map(renderFailure).join('')}</div>`}
</section>
  ${skipped.length > 0 ? `<section class="section skipped-section">
  <details>
    <summary>Skipped Tests (${skipped.length})</summary>
    <div class="failure-list" style="margin-top:12px">${skipped.map(renderSkipped).join('')}</div>
  </details>
</section>` : ''}
<section class="section" style="padding-top:0">
  <a class="btn" href="summary.json">Export JSON</a>
  <a class="btn" href="tests.json" style="margin-left:8px">Raw Test Data</a>
</section>
<p class="section" style="padding-top:0"><em>${escapeHtml(ctx.commitMessage)}</em> — <a href="${escapeHtml(ctx.commitUrl)}">${escapeHtml(ctx.commitShortSha)}</a> by ${escapeHtml(ctx.author)}</p>`;

  return renderLayout({
    title: 'Test Summary',
    reportTitle,
    activeNav: 'summary',
    run,
    theme,
    failedCount: failures.length,
  }, body);
}
