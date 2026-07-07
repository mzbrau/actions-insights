(function () {
  'use strict';

  const THEME_KEY = 'actions-insights-theme';
  const OUTCOMES = ['passed', 'failed', 'skipped', 'inconclusive'];
  const OUTCOME_ICONS = { passed: '✅', failed: '❌', skipped: '⏭', inconclusive: '❓' };

  let runData = {};
  let trendsData = null;

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

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
        $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
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
      renderTrendCharts();
      renderAllTests();
      return;
    }
    try {
      const res = await fetch('./trends.json');
      if (res.ok) {
        trendsData = await res.json();
        if (notice) notice.classList.add('hidden');
        renderTrendCharts();
        renderAllTests();
        return;
      }
    } catch {}
    if (notice) notice.classList.remove('hidden');
    const loadBtn = $('#load-trends-btn');
    const fileInput = $('#load-trends-file');
    if (loadBtn && fileInput) {
      loadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            trendsData = JSON.parse(reader.result);
            notice?.classList.add('hidden');
            renderTrendCharts();
            renderAllTests();
          } catch {}
        };
        reader.readAsText(file);
      });
    }
    renderAllTests();
  }

  function renderPieChart() {
    const svg = $('#pie-chart');
    if (!svg || !runData.stats) return;
    const { passed, failed, skipped, inconclusive } = runData.stats;
    const total = passed + failed + skipped + (inconclusive || 0);
    if (total === 0) return;

    const colors = ['#0a6e31', '#ba1a1a', '#727785', '#913900'];
    const values = [passed, failed, skipped, inconclusive || 0].filter((v, i, arr) => arr.slice(0, 3).some(x => x > 0) || v > 0);
    const labels = ['Passed', 'Failed', 'Skipped', 'Inconclusive'];
    const cx = 80, cy = 80, r = 60;
    let offset = 0;
    let paths = '';

    [passed, failed, skipped, inconclusive || 0].forEach((val, i) => {
      if (val === 0) return;
      const pct = val / total;
      const angle = pct * 2 * Math.PI;
      const x1 = cx + r * Math.sin(offset);
      const y1 = cy - r * Math.cos(offset);
      offset += angle;
      const x2 = cx + r * Math.sin(offset);
      const y2 = cy - r * Math.cos(offset);
      const large = angle > Math.PI ? 1 : 0;
      paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${colors[i]}"/>`;
    });

    svg.innerHTML = paths + `<circle cx="${cx}" cy="${cy}" r="30" fill="var(--surface-container-lowest)"/>`;
  }

  function renderBarChart() {
    const svg = $('#bar-chart');
    if (!svg) return;
    const points = trendsData?.summary?.points ?? [];
    if (points.length === 0) {
      svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="var(--on-surface-variant)" font-size="12">No run history yet</text>';
      return;
    }

    const w = 280, h = 140, pad = 24;
    const maxVal = Math.max(...points.map((p) => p.passed + p.failed), 1);
    const barW = (w - pad * 2) / points.length - 4;
    let bars = '';

    points.forEach((p, i) => {
      const x = pad + i * (barW + 4);
      const passH = ((p.passed / maxVal) * (h - pad * 2));
      const failH = ((p.failed / maxVal) * (h - pad * 2));
      const base = h - pad;
      bars += `<rect x="${x}" y="${base - passH - failH}" width="${barW}" height="${failH}" fill="#ba1a1a" rx="2"/>`;
      bars += `<rect x="${x}" y="${base - passH}" width="${barW}" height="${passH}" fill="#0a6e31" rx="2"/>`;
    });

    svg.innerHTML = bars;
  }

  function renderTrendCharts() {
    renderBarChart();
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
    if (test.ns && test.c) return `${test.ns}.${test.c}`;
    const n = test.n || '';
    const lastDot = n.lastIndexOf('.');
    return lastDot > 0 ? n.slice(0, lastDot) : n;
  }

  function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
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
        // default + name
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

      let rows = recent.map((p) => {
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

    function escapeHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
        $('#visible-count').textContent = String(filtered.length);

        $$('.history-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const target = document.getElementById(btn.getAttribute('data-target'));
            target?.classList.toggle('open');
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
      $('#visible-count').textContent = String(filtered.length);

      $$('.history-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = document.getElementById(btn.getAttribute('data-target'));
          target?.classList.toggle('open');
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
          chip.classList.remove('active');
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
    loadTrends();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
