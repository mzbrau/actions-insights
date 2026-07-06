(function () {
  const THEME_KEY = 'actions-insights-theme';
  const defaultTheme = document.documentElement.getAttribute('data-default-theme') || 'auto';

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
    const theme = getStoredTheme() || defaultTheme;
    applyTheme(theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        applyTheme(next);
      });
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if ((getStoredTheme() || defaultTheme) === 'auto') applyTheme('auto');
    });
  }

  function initFailures() {
    document.querySelectorAll('.failure-header').forEach((header) => {
      header.addEventListener('click', () => {
        header.closest('.failure-item')?.classList.toggle('open');
      });
    });
    const expandAll = document.getElementById('expand-all-failures');
    if (expandAll) {
      expandAll.addEventListener('click', () => {
        document.querySelectorAll('.failure-item').forEach((el) => el.classList.add('open'));
      });
    }
    document.querySelectorAll('.copy-btn').forEach((btn) => {
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
    const failureSearch = document.getElementById('failure-search');
    if (failureSearch) {
      failureSearch.addEventListener('input', () => {
        const q = failureSearch.value.toLowerCase();
        document.querySelectorAll('.failure-item').forEach((item) => {
          const text = item.textContent?.toLowerCase() || '';
          item.style.display = text.includes(q) ? '' : 'none';
        });
      });
    }
  }

  function tokenize(value) {
    return (value || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  }

  function initAllTests() {
    const dataEl = document.getElementById('tests-data');
    const container = document.getElementById('virtual-table-body');
    if (!dataEl || !container) return;

    const payload = JSON.parse(dataEl.textContent || '{}');
    const tests = payload.tests || [];
    const slowThreshold = payload.slowThreshold || 1000;
    const outcomes = ['passed', 'failed', 'skipped', 'inconclusive'];
    const rowHeight = 36;
    let filters = { failed: false, passed: false, skipped: false, slow: false, q: '' };

    const searchInput = document.getElementById('test-search');
    const chips = document.querySelectorAll('[data-filter]');
    const clearBtn = document.getElementById('clear-filters');

    function matches(test) {
      const outcome = outcomes[test.o];
      if (filters.failed && outcome !== 'failed') return false;
      if (filters.passed && outcome !== 'passed') return false;
      if (filters.skipped && outcome !== 'skipped') return false;
      if (filters.slow && test.d < slowThreshold) return false;
      if (filters.q) {
        const hay = [test.n, test.ns, test.c, test.a, test.m].join(' ').toLowerCase();
        if (!hay.includes(filters.q)) return false;
      }
      return true;
    }

    let filtered = tests;
    function refresh() {
      filtered = tests.filter(matches);
      render();
      const countEl = document.getElementById('visible-count');
      if (countEl) countEl.textContent = String(filtered.length);
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        filters.q = searchInput.value.toLowerCase();
        refresh();
      });
    }
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.getAttribute('data-filter');
        if (!key) return;
        filters[key] = !filters[key];
        chip.classList.toggle('active', filters[key]);
        refresh();
      });
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        filters = { failed: false, passed: false, skipped: false, slow: false, q: '' };
        chips.forEach((c) => c.classList.remove('active'));
        if (searchInput) searchInput.value = '';
        refresh();
      });
    }

    const scroll = container.closest('.virtual-scroll');
    function render() {
      if (!scroll) return;
      const scrollTop = scroll.scrollTop;
      const viewHeight = scroll.clientHeight;
      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
      const visible = Math.ceil(viewHeight / rowHeight) + 10;
      const end = Math.min(filtered.length, start + visible);

      let html = `<div class="virtual-spacer" style="height:${filtered.length * rowHeight}px"></div><div class="virtual-rows" style="transform:translateY(${start * rowHeight}px)">`;
      html += '<table class="data-table"><tbody>';
      for (let i = start; i < end; i++) {
        const t = filtered[i];
        const outcome = outcomes[t.o];
        const slow = t.d >= slowThreshold ? '<span class="slow-badge">SLOW</span>' : '';
        const nf = t.nf ? ' <span class="slow-badge">NEW</span>' : '';
        html += `<tr class="${outcome}" id="test-${t.i}">` +
          `<td><span class="status-pill ${outcome}">${outcome}</span></td>` +
          `<td class="mono">${esc(t.n)}${slow}${nf}</td>` +
          `<td class="mono hide-mobile">${esc(t.ns || '')}.${esc(t.c || '')}</td>` +
          `<td class="mono">${formatMs(t.d)}</td>` +
          `<td class="mono hide-mobile">${esc(t.a || '')}</td></tr>`;
      }
      html += '</tbody></table></div>';
      container.innerHTML = html;
    }

    if (scroll) {
      scroll.addEventListener('scroll', render, { passive: true });
    }
    refresh();

    const hash = window.location.hash;
    if (hash.startsWith('#test-')) {
      const id = hash.slice(6);
      const idx = tests.findIndex((t) => String(t.i) === id);
      if (idx >= 0 && scroll) {
        scroll.scrollTop = idx * rowHeight;
      }
    }
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatMs(ms) {
    if (ms < 1000) return ms + 'ms';
    return (ms / 1000).toFixed(2) + 's';
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initFailures();
    initAllTests();
  });
})();
