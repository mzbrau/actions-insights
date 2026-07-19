(function () {
  'use strict';

  const THEME_KEY = 'actions-insights-theme';
  const OUTCOMES = ['passed', 'failed', 'skipped', 'inconclusive'];
  const OUTCOME_ICONS = { passed: '✅', failed: '❌', skipped: '⏭', inconclusive: '❓' };
  const SEVERITIES = ['error', 'warning', 'note'];

  let runData = {};
  let trendsData = null;

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  }

  function applyTheme(theme) {
    const resolved = theme === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
  }

  function initTheme() {
    const defaultTheme = document.documentElement.getAttribute('data-default-theme') || 'auto';
    applyTheme(getStoredTheme() || defaultTheme);
    const btn = $('#theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        applyTheme(next);
      });
    }
  }

  function initTabs() {
    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        $$('.tab').forEach((t) => {
          const active = t === tab;
          t.classList.toggle('active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${target}`));
      });
    });
  }

  function initFailures() {
    $$('.failure-header').forEach((header) => {
      header.addEventListener('click', () => {
        header.closest('.failure-item')?.classList.toggle('open');
      });
    });
    $$('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pre = btn.closest('.code-block')?.querySelector('pre');
        if (pre) {
          navigator.clipboard.writeText(pre.textContent || '').then(() => {
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
          });
        }
      });
    });
  }

  function parseRunData() {
    const el = $('#run-data');
    if (!el) return;
    try { runData = JSON.parse(el.textContent || '{}'); } catch { runData = {}; }
  }

  function parseEmbeddedTrends() {
    const el = $('#trends-data');
    if (!el) return null;
    try { return JSON.parse(el.textContent || 'null'); } catch { return null; }
  }

  async function loadTrends() {
    const notice = $('#trends-notice');
    const embedded = parseEmbeddedTrends();
    if (embedded) {
      trendsData = embedded;
      if (notice) notice.classList.add('hidden');
      renderAllTests();
      return;
    }
    // Sidecar fallback for unzipped local folder layouts (zipped artifact next to report.html)
    try {
      const res = await fetch('./trends.json');
      if (res.ok) {
        trendsData = await res.json();
        if (notice) notice.classList.add('hidden');
        renderAllTests();
        return;
      }
    } catch {}
    if (notice) notice.classList.remove('hidden');
    renderAllTests();
  }

  function renderPieChart() {
    const svg = $('#pie-chart');
    if (!svg || !runData.stats) return;
    const { passed, failed, skipped, inconclusive } = runData.stats;
    const total = passed + failed + skipped + (inconclusive || 0);
    if (total === 0) return;

    const colors = [
      'var(--chart-passed, #0a6e31)',
      'var(--chart-failed, #ba1a1a)',
      'var(--chart-skipped, #727785)',
      'var(--chart-inconclusive, #913900)',
    ];
    const cx = 36, cy = 36, r = 28, inner = 14;
    let offset = -Math.PI / 2;
    let paths = '';

    [passed, failed, skipped, inconclusive || 0].forEach((val, i) => {
      if (val === 0) return;
      const angle = (val / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(offset);
      const y1 = cy + r * Math.sin(offset);
      offset += angle;
      const x2 = cx + r * Math.cos(offset);
      const y2 = cy + r * Math.sin(offset);
      const large = angle > Math.PI ? 1 : 0;
      paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${colors[i]}"/>`;
    });

    svg.innerHTML = paths + `<circle cx="${cx}" cy="${cy}" r="${inner}" fill="var(--surface-container-lowest)"/>`;
  }

  function getShortName(test) {
    const candidate = test.m || test.n || '';
    if (candidate && !candidate.includes('.')) return candidate;
    const full = test.n || candidate;
    const lastDot = full.lastIndexOf('.');
    return lastDot >= 0 ? full.slice(lastDot + 1) : full;
  }

  function getCodeSearchName(test) {
    const short = getShortName(test);
    const paren = short.indexOf('(');
    return (paren >= 0 ? short.slice(0, paren) : short).trim();
  }

  function getClassName(test) {
    const method = test.m ?? test.n;
    if (method && test.n.endsWith(`.${method}`)) {
      return test.n.slice(0, -(method.length + 1));
    }
    if (test.ns && test.c && !test.c.includes('(')) {
      return `${test.ns}.${test.c}`;
    }
    if (test.c && !test.c.includes('(')) {
      return test.c;
    }
    const n = test.n || '';
    const lastDot = n.lastIndexOf('.');
    return lastDot > 0 ? n.slice(0, lastDot) : n;
  }

  function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  }

  function spectrumColor(pct) {
    return `hsl(${(pct / 100) * 120}, 65%, 45%)`;
  }

  function formatPct(value) {
    if (value === undefined || value === null) return '—';
    return `${Number(value).toFixed(1)}%`;
  }

  function fileBasename(filePath) {
    const parts = String(filePath).split(/[/\\]/);
    return parts[parts.length - 1] || filePath;
  }

  function collectProjectFiles(project, detail) {
    if (project.files?.length && detail?.paths) {
      return project.files.map((f) => ({
        path: detail.paths[f.p] || String(f.p),
        metrics: f.metrics || {},
        methods: [],
      })).filter((f) => f.path);
    }
    const files = [];
    for (const pkg of project.packages || []) {
      for (const cls of pkg.classes || []) {
        if (!cls.file) continue;
        let entry = files.find((f) => f.path === cls.file);
        if (!entry) {
          entry = { path: cls.file, metrics: cls.metrics || {}, methods: [] };
          files.push(entry);
        }
        if (cls.methods?.length) {
          for (const m of cls.methods) {
            entry.methods.push({
              name: m.name || m.n || 'unknown',
              metrics: m.metrics || {},
            });
          }
        }
      }
    }
    return files.sort((a, b) => (a.metrics.line ?? 101) - (b.metrics.line ?? 101));
  }

  function metricRow(label, value, spectrum) {
    const pct = value === undefined ? 0 : Math.min(100, Math.max(0, value));
    const fill = spectrum && value !== undefined
      ? spectrumColor(pct)
      : 'var(--primary)';
    return `<div class="coverage-metric-row">
      <span class="coverage-metric-row-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
      <div class="coverage-metric-row-track"><div class="coverage-metric-row-fill" style="width:${pct}%;background:${fill}"></div></div>
      <span class="coverage-metric-row-value">${formatPct(value)}</span>
    </div>`;
  }

  function progressBar(label, value, variant, spectrum) {
    if (value === undefined) return '';
    const pct = Math.min(100, Math.max(0, value));
    const fillStyle = spectrum
      ? `width:${pct}%;background:${spectrumColor(pct)}`
      : `width:${pct}%`;
    return `<div class="coverage-progress">
      <div class="coverage-progress-header">
        <span class="coverage-progress-label">${escapeHtml(label)}</span>
        <span class="coverage-progress-value">${pct.toFixed(1)}%</span>
      </div>
      <div class="coverage-progress-track coverage-progress-${variant}">
        <div class="coverage-progress-fill" style="${fillStyle}"></div>
      </div>
    </div>`;
  }

  function renderCoveragePanel() {
    const root = $('#coverage-panel-root');
    if (!root || !runData.coverage) return;

    const summary = runData.coverage.summary || {};
    const detail = runData.coverage.detail;
    const projects = detail?.projects?.length
      ? detail.projects
      : Object.entries(summary.projects || {}).map(([name, metrics]) => ({ name, metrics }));

    let html = `<section class="coverage-run-summary">
      ${progressBar('Line coverage', summary.line, 'line', true)}
      ${progressBar('Branch coverage', summary.branch, 'branch', true)}
    </section>
    <section class="section">
      <h2 class="section-title">Projects</h2>`;

    if (projects.length === 0) {
      html += '<p class="muted">No project-level coverage breakdown available.</p></section>';
      root.innerHTML = html;
      return;
    }

    html += '<div class="coverage-project-list">';
    for (const project of projects) {
      const files = collectProjectFiles(project, detail);
      const branchNote = project.metrics?.branch !== undefined
        ? `<span class="coverage-project-branch">${formatPct(project.metrics.branch)} branches</span>`
        : '';
      let fileHtml = '';
      if (files.length > 0) {
        fileHtml = '<ul class="coverage-file-list">';
        for (const file of files) {
          const methods = file.methods || [];
          let methodHtml = '';
          if (methods.length > 0) {
            methodHtml = `<div class="coverage-method-list">${methods.map((m) =>
              `<div class="coverage-method-row">
                <span class="coverage-method-name" title="${escapeHtml(m.name)}">${escapeHtml(m.name)}</span>
                <span>${formatPct(m.metrics?.line)}</span>
              </div>`).join('')}</div>`;
          }
          fileHtml += `<li class="coverage-file-item">
            <details>
              <summary class="coverage-file-summary">
                ${metricRow(fileBasename(file.path), file.metrics?.line, true)}
                ${file.metrics?.branch !== undefined ? `<span class="muted">${formatPct(file.metrics.branch)} branches</span>` : ''}
              </summary>
              ${methodHtml || (methods.length === 0 ? '<p class="muted" style="font-size:12px;margin:8px 0 0">No method breakdown available.</p>' : '')}
            </details>
          </li>`;
        }
        fileHtml += '</ul>';
      } else {
        fileHtml = '<p class="muted" style="font-size:12px;margin:8px 0 0">Expand for file details when available.</p>';
      }

      html += `<details class="coverage-project-item">
        <summary class="coverage-project-summary">
          ${metricRow(project.name, project.metrics?.line, true)}
          ${branchNote}
        </summary>
        ${fileHtml}
      </details>`;
    }
    html += '</div></section>';
    root.innerHTML = html;
  }

  function expandDiagnostics(record) {
    if (!record?.items) return [];
    return record.items.map((item) => ({
      severity: SEVERITIES[item.s] || 'warning',
      message: item.m,
      file: item.p !== undefined ? record.paths?.[item.p] : undefined,
      line: item.l,
      column: item.c,
      code: item.r,
      source: item.o,
    }));
  }

  function renderBuildPanel() {
    const root = $('#build-panel-root');
    if (!root) return;
    if (!runData.diagnostics && !runData.timing) {
      root.innerHTML = '<div class="empty-state">No build diagnostics or timing data.</div>';
      return;
    }

    const diag = runData.diagnostics;
    const timing = runData.timing;
    const summary = diag?.summary;
    const timingSummary = timing?.summary;
    const steps = [...(timingSummary?.steps || [])].sort((a, b) => b.durationMs - a.durationMs);
    const maxStepMs = steps[0]?.durationMs || 1;

    let html = '<div class="build-summary-cards">';
    if (summary) {
      html += `<div class="build-summary-card build-summary-card--error">
        <span class="build-summary-card-value">${summary.errors ?? 0}</span>
        <span class="build-summary-card-label">Errors</span>
      </div>
      <div class="build-summary-card build-summary-card--warning">
        <span class="build-summary-card-value">${summary.warnings ?? 0}</span>
        <span class="build-summary-card-label">Warnings</span>
      </div>`;
    }
    if (timingSummary?.workflowDurationMs !== undefined) {
      html += `<div class="build-summary-card">
        <span class="build-summary-card-value">${formatDuration(timingSummary.workflowDurationMs)}</span>
        <span class="build-summary-card-label">Workflow run</span>
      </div>`;
    }
    if (runData.stats?.durationMs > 0) {
      html += `<div class="build-summary-card">
        <span class="build-summary-card-value">${formatDuration(runData.stats.durationMs)}</span>
        <span class="build-summary-card-label">Test execution</span>
      </div>`;
    }
    if (timingSummary?.slowestStep) {
      html += `<div class="build-summary-card build-summary-card--wide">
        <span class="build-summary-card-value build-summary-card-value--small">${escapeHtml(timingSummary.slowestStep)}</span>
        <span class="build-summary-card-label">Slowest step</span>
      </div>`;
    }
    html += '</div>';

    if (steps.length > 0) {
      html += `<p class="build-timing-note">Step durations are wall-clock times per step. Parallel jobs overlap — they do not add up to workflow run time.</p>
      <div class="chart-card">
        <h3>Workflow steps</h3>
        <div class="workflow-step-timeline">
          ${steps.map((step) => `<div class="workflow-step-row">
            <div class="workflow-step-label">
              <span class="workflow-step-job">${escapeHtml(step.jobName)}</span>
              <span class="workflow-step-name">${escapeHtml(step.stepName)}</span>
            </div>
            <div class="workflow-step-bar-track">
              <span class="workflow-step-bar-fill" style="width:${Math.max(4, (step.durationMs / maxStepMs) * 100)}%"></span>
            </div>
            <span class="workflow-step-duration">${formatDuration(step.durationMs)}</span>
          </div>`).join('')}
        </div>
      </div>`;

      if (timing?.runner || (timingSummary?.actionPhases && Object.keys(timingSummary.actionPhases).length > 0)) {
        html += '<section class="build-run-metadata">';
        if (timing?.runner) {
          html += `<p class="workflow-runner-meta">Runner: ${escapeHtml(timing.runner.os || 'unknown')}${
            timing.runner.labels?.length ? ` (${escapeHtml(timing.runner.labels.join(', '))})` : ''
          }</p>`;
        }
        if (timingSummary?.actionPhases && Object.keys(timingSummary.actionPhases).length > 0) {
          html += `<details class="action-phases-details"><summary>Actions Insights phases</summary><ul>
            ${Object.entries(timingSummary.actionPhases).map(([name, ms]) =>
              `<li>${escapeHtml(name)}: ${formatDuration(ms)}</li>`).join('')}
          </ul></details>`;
        }
        html += '</section>';
      }
    }

    if (summary) {
      html += `<div class="chart-card"><h3>Diagnostics by file</h3><div id="diagnostic-browser-root"></div></div>`;
    }

    root.innerHTML = html;
    if (summary && diag) initDiagnosticBrowser(diag);
  }

  function initDiagnosticBrowser(diag) {
    const container = $('#diagnostic-browser-root');
    if (!container) return;

    let severityFilter = 'all';
    let selectedFile = null;
    const items = expandDiagnostics(diag);

    function countBySeverity(list) {
      let errors = 0, warnings = 0, notes = 0;
      for (const item of list) {
        if (item.severity === 'error') errors += 1;
        else if (item.severity === 'warning') warnings += 1;
        else notes += 1;
      }
      return { errors, warnings, notes };
    }

    function render() {
      const filtered = severityFilter === 'all'
        ? items
        : items.filter((i) => i.severity === severityFilter);
      const byFile = new Map();
      for (const item of filtered) {
        const key = item.file || '(no file)';
        if (!byFile.has(key)) byFile.set(key, []);
        byFile.get(key).push(item);
      }
      const files = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
      if (files.length > 0 && (selectedFile === null || !byFile.has(selectedFile))) {
        selectedFile = files[0][0];
      }
      const selectedItems = selectedFile ? (byFile.get(selectedFile) || []) : [];

      container.innerHTML = `
        <div class="diagnostic-filters">
          ${['all', 'error', 'warning', 'note'].map((f) =>
            `<button type="button" class="filter-chip${severityFilter === f ? ' active' : ''}" data-sev="${f}">${f}</button>`).join('')}
        </div>
        <div class="diagnostic-browser">
          <ul class="diagnostic-file-list">
            ${files.map(([file, list]) => {
              const c = countBySeverity(list);
              return `<li><button type="button" class="diagnostic-file-btn${selectedFile === file ? ' active' : ''}" data-file="${escapeHtml(file)}">
                ${escapeHtml(fileBasename(file))}
                <span class="diagnostic-file-badges">
                  ${c.errors ? `<span class="diagnostic-count-badge diagnostic-count-badge--error">${c.errors}E</span>` : ''}
                  ${c.warnings ? `<span class="diagnostic-count-badge diagnostic-count-badge--warning">${c.warnings}W</span>` : ''}
                  ${c.notes ? `<span class="diagnostic-count-badge">${c.notes}N</span>` : ''}
                </span>
              </button></li>`;
            }).join('') || '<li class="muted">No diagnostics</li>'}
          </ul>
          <ul class="diagnostic-items">
            ${selectedItems.map((item) => `<li class="diagnostic-item">
              <span class="diagnostic-item-severity ${item.severity}">${item.severity}</span>
              ${item.code ? `<code>${escapeHtml(item.code)}</code> ` : ''}
              ${escapeHtml(item.message)}
              ${item.line !== undefined ? `<div class="diagnostic-item-loc">line ${item.line}${item.column !== undefined ? `:${item.column}` : ''}</div>` : ''}
            </li>`).join('') || '<li class="muted">Select a file</li>'}
          </ul>
        </div>
        ${diag.truncated ? `<p class="muted">Showing first ${items.length} of ${items.length + diag.truncated} diagnostics.</p>` : ''}`;

      container.querySelectorAll('[data-sev]').forEach((btn) => {
        btn.addEventListener('click', () => {
          severityFilter = btn.getAttribute('data-sev') || 'all';
          render();
        });
      });
      container.querySelectorAll('[data-file]').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedFile = btn.getAttribute('data-file');
          render();
        });
      });
    }

    render();
  }

  function renderAllTests() {
    const container = $('#all-tests-list');
    if (!container) return;
    const tests = runData.tests || [];
    const slowThreshold = runData.slowThreshold || 1000;

    let activeFilters = new Set();
    let searchQuery = '';
    let sortBy = 'default';

    function getPassRate(fullName) {
      const entry = trendsData?.tests?.[fullName];
      if (!entry) return null;
      return { rate: entry.passRate, count: entry.runCount };
    }

    function filteredTests() {
      return tests.filter((t) => {
        const outcome = OUTCOMES[t.o] || 'inconclusive';
        if (activeFilters.has('failed') && outcome !== 'failed') return false;
        if (activeFilters.has('passed') && outcome !== 'passed') return false;
        if (activeFilters.has('skipped') && outcome !== 'skipped') return false;
        if (activeFilters.has('slow') && t.d < slowThreshold) return false;
        if (activeFilters.has('new') && !t.nf) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const hay = [t.n, t.a, t.ns, t.c, getClassName(t)].join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }

    function sortTests(list) {
      const sorted = [...list];
      sorted.sort((a, b) => {
        if (sortBy === 'duration') return b.d - a.d;
        if (sortBy === 'outcome') return (a.o || 0) - (b.o || 0);
        if (sortBy === 'passRate') {
          const ra = getPassRate(a.n)?.rate ?? -1;
          const rb = getPassRate(b.n)?.rate ?? -1;
          return ra - rb;
        }
        return getShortName(a).localeCompare(getShortName(b));
      });
      return sorted;
    }

    function renderHistory(fullName) {
      const entry = trendsData?.tests?.[fullName];
      if (!entry || entry.points.length === 0) {
        return '<p style="font-size:12px;color:var(--on-surface-variant)">No history available yet.</p>';
      }

      const recent = entry.points.slice(0, 20);
      const maxD = Math.max(...recent.map((p) => p.d), 1);

      let sparkline = '<div class="history-sparkline">';
      recent.slice().reverse().forEach((p) => {
        const cls = p.o === 0 ? 'passed' : p.o === 1 ? 'failed' : p.o === 2 ? 'skipped' : 'other';
        const h = Math.max(4, (p.d / maxD) * 24);
        sparkline += `<div class="spark-bar ${cls}" style="height:${h}px" title="${OUTCOMES[p.o]} · ${formatDuration(p.d)}"></div>`;
      });
      sparkline += '</div>';

      const rows = recent.map((p) => {
        const branchCls = p.branchKey === 'main' ? 'branch-chip main' : 'branch-chip';
        return `<tr>
          <td>${new Date(p.date).toLocaleString()}</td>
          <td><span class="${branchCls}">${escapeHtml(p.branchLabel)}</span></td>
          <td>${OUTCOME_ICONS[OUTCOMES[p.o]] || '❓'}</td>
          <td>${formatDuration(p.d)}</td>
          <td><code>${escapeHtml(p.commitShortSha)}</code></td>
        </tr>`;
      }).join('');

      return `${sparkline}
        <div style="margin-bottom:8px;font-weight:600">Pass rate: ${entry.passRate}% (${entry.runCount} runs)</div>
        <table class="history-table"><thead><tr><th>Date</th><th>Branch</th><th>Result</th><th>Duration</th><th>Commit</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    function render() {
      const filtered = sortTests(filteredTests());

      if (sortBy !== 'default') {
        const wfUrl = runData?.context?.jobUrl || runData?.context?.workflowUrl;
        const repo = runData?.context?.repository;

        let html = '<div class="flat-list">';
        for (const test of filtered) {
          const outcome = OUTCOMES[test.o] || 'inconclusive';
          const id = `hist-${test.i}`;
          const pr = getPassRate(test.n);
          const codeUrl = repo ? `https://github.com/search?q=${encodeURIComponent(`repo:${repo} ${getCodeSearchName(test)}`)}&type=code` : null;
          const cls = getClassName(test);
          const project = typeof test.a === 'string' ? test.a.trim() : '';
          const meta = project ? `${project} · ${cls}` : cls;

          html += `<div class="test-row" data-name="${escapeHtml(test.n)}">
            <span class="test-outcome">${OUTCOME_ICONS[outcome]}</span>
            <span class="test-name" title="${escapeHtml(test.n)}">${escapeHtml(getShortName(test))}</span>
            <span class="test-meta">${escapeHtml(meta)}</span>
            <span class="test-links">
              ${wfUrl ? `<a href="${escapeHtml(wfUrl)}" target="_blank" rel="noopener">log</a>` : ''}
              ${codeUrl ? `${wfUrl ? ' · ' : ''}<a href="${escapeHtml(codeUrl)}" target="_blank" rel="noopener">code</a>` : ''}
            </span>
            <span class="test-duration">${formatDuration(test.d)}</span>
            ${pr ? `<span class="pass-rate">${pr.rate}%</span>` : ''}
            <button class="history-btn" data-target="${id}" type="button">History</button>
          </div>
          <div class="test-history" id="${id}">${renderHistory(test.n)}</div>`;
        }
        html += '</div>';

        if (filtered.length === 0) {
          html = '<div class="empty-state">No tests match the current filters.</div>';
        }

        container.innerHTML = html;
        const countEl = $('#visible-count');
        if (countEl) countEl.textContent = String(filtered.length);

        $$('.history-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            document.getElementById(btn.getAttribute('data-target'))?.classList.toggle('open');
          });
        });
        return;
      }

      const byProject = new Map();
      for (const test of filtered) {
        const project = typeof test.a === 'string' ? test.a.trim() : '';
        const key = project || '—';
        if (!byProject.has(key)) byProject.set(key, new Map());
        const byClass = byProject.get(key);
        const cls = getClassName(test);
        if (!byClass.has(cls)) byClass.set(cls, []);
        byClass.get(cls).push(test);
      }

      let html = '';
      const sortedProjects = [...byProject.keys()].sort((a, b) => {
        if (a === '—' && b !== '—') return 1;
        if (a !== '—' && b === '—') return -1;
        return a.localeCompare(b);
      });

      for (const project of sortedProjects) {
        const showProjectTitle = project !== '—';
        html += `<div class="project-group">${showProjectTitle ? `<div class="project-title">${escapeHtml(project)}</div>` : ''}`;
        const byClass = byProject.get(project);
        const sortedClasses = [...byClass.keys()].sort();

        for (const cls of sortedClasses) {
          html += `<div class="class-group"><div class="class-title">${escapeHtml(cls)}</div>`;
          byClass.get(cls).sort((a, b) => getShortName(a).localeCompare(getShortName(b)));
          for (const test of byClass.get(cls)) {
            const outcome = OUTCOMES[test.o] || 'inconclusive';
            const id = `hist-${test.i}`;
            const pr = getPassRate(test.n);
            const wfUrl = runData?.context?.jobUrl || runData?.context?.workflowUrl;
            const repo = runData?.context?.repository;
            const codeUrl = repo ? `https://github.com/search?q=${encodeURIComponent(`repo:${repo} ${getCodeSearchName(test)}`)}&type=code` : null;
            html += `<div class="test-row" data-name="${escapeHtml(test.n)}">
              <span class="test-outcome">${OUTCOME_ICONS[outcome]}</span>
              <span class="test-name" title="${escapeHtml(test.n)}">${escapeHtml(getShortName(test))}</span>
              <span class="test-links">
                ${wfUrl ? `<a href="${escapeHtml(wfUrl)}" target="_blank" rel="noopener">log</a>` : ''}
                ${codeUrl ? `${wfUrl ? ' · ' : ''}<a href="${escapeHtml(codeUrl)}" target="_blank" rel="noopener">code</a>` : ''}
              </span>
              <span class="test-duration">${formatDuration(test.d)}</span>
              ${pr ? `<span class="pass-rate">${pr.rate}%</span>` : ''}
              <button class="history-btn" data-target="${id}" type="button">History</button>
            </div>
            <div class="test-history" id="${id}">${renderHistory(test.n)}</div>`;
          }
          html += '</div>';
        }
        html += '</div>';
      }

      if (filtered.length === 0) {
        html = '<div class="empty-state">No tests match the current filters.</div>';
      }

      container.innerHTML = html;
      const countEl = $('#visible-count');
      if (countEl) countEl.textContent = String(filtered.length);

      $$('.history-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.getElementById(btn.getAttribute('data-target'))?.classList.toggle('open');
        });
      });
    }

    $('#test-search')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    $$('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.getAttribute('data-filter');
        if (activeFilters.has(filter)) {
          activeFilters.delete(filter);
          chip.classList.remove('active', 'passed', 'failed');
        } else {
          activeFilters.add(filter);
          chip.classList.add('active');
          if (filter === 'passed') chip.classList.add('passed');
          if (filter === 'failed') chip.classList.add('failed');
        }
        render();
      });
    });

    $('#sort-select')?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      render();
    });

    render();
  }

  function initRunTimestamp() {
    const el = $('#run-timestamp');
    if (!el) return;
    const iso = el.getAttribute('data-run-timestamp') || runData?.context?.completedAt;
    if (!iso) return;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return;
    el.textContent = date.toLocaleString();
    el.title = `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
  }

  function init() {
    initTheme();
    initTabs();
    initFailures();
    parseRunData();
    initRunTimestamp();
    renderPieChart();
    renderCoveragePanel();
    renderBuildPanel();
    loadTrends();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
