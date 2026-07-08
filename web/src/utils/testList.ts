import type { CompactTestRecord, TestHistoryEntry } from '@actions-insights/history-models';
import { CODE_TO_OUTCOME } from '@actions-insights/history-models';

export type TestSortBy = 'default' | 'name' | 'duration' | 'outcome' | 'passRate';
export type TestFilterKey = 'failed' | 'passed' | 'skipped' | 'slow' | 'new';

export function getShortName(test: CompactTestRecord): string {
  const candidate = test.m || test.n || '';
  if (candidate && !candidate.includes('.')) return candidate;
  const full = test.n || candidate;
  const lastDot = full.lastIndexOf('.');
  return lastDot >= 0 ? full.slice(lastDot + 1) : full;
}

export function getCodeSearchName(test: CompactTestRecord): string {
  const short = getShortName(test);
  const paren = short.indexOf('(');
  return (paren >= 0 ? short.slice(0, paren) : short).trim();
}

export function getClassName(test: CompactTestRecord): string {
  if (test.ns && test.c) return `${test.ns}.${test.c}`;
  const n = test.n || '';
  const lastDot = n.lastIndexOf('.');
  return lastDot > 0 ? n.slice(0, lastDot) : n;
}

export function getProjectName(test: CompactTestRecord): string {
  return typeof test.a === 'string' ? test.a.trim() : '';
}

export function buildCodeSearchUrl(repository: string, test: CompactTestRecord): string {
  const method = getCodeSearchName(test);
  const q = encodeURIComponent(`repo:${repository} ${method}`);
  return `https://github.com/search?q=${q}&type=code`;
}

export interface TestFilterOptions {
  search: string;
  filters: Set<TestFilterKey>;
  slowThreshold: number;
}

export function filterTests(tests: CompactTestRecord[], options: TestFilterOptions): CompactTestRecord[] {
  const { search, filters, slowThreshold } = options;
  const q = search.toLowerCase();

  return tests.filter((t) => {
    const outcome = CODE_TO_OUTCOME[t.o] ?? 'inconclusive';
    if (filters.has('failed') && outcome !== 'failed') return false;
    if (filters.has('passed') && outcome !== 'passed') return false;
    if (filters.has('skipped') && outcome !== 'skipped') return false;
    if (filters.has('slow') && t.d < slowThreshold) return false;
    if (filters.has('new') && !t.nf) return false;
    if (q) {
      const hay = [t.n, t.a, t.ns, t.c, getClassName(t)].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortTests(
  tests: CompactTestRecord[],
  sortBy: TestSortBy,
  getPassRate: (fullName: string) => number | null,
): CompactTestRecord[] {
  const sorted = [...tests];
  sorted.sort((a, b) => {
    if (sortBy === 'duration') return b.d - a.d;
    if (sortBy === 'outcome') return (a.o || 0) - (b.o || 0);
    if (sortBy === 'passRate') {
      const ra = getPassRate(a.n) ?? -1;
      const rb = getPassRate(b.n) ?? -1;
      return ra - rb;
    }
    if (sortBy === 'name') return getShortName(a).localeCompare(getShortName(b));
    return getShortName(a).localeCompare(getShortName(b));
  });
  return sorted;
}

export type GroupedTests = Map<string, Map<string, CompactTestRecord[]>>;

export function groupTestsByProjectAndClass(tests: CompactTestRecord[]): GroupedTests {
  const byProject = new Map<string, Map<string, CompactTestRecord[]>>();

  for (const test of tests) {
    const project = getProjectName(test) || '—';
    if (!byProject.has(project)) byProject.set(project, new Map());
    const byClass = byProject.get(project)!;
    const cls = getClassName(test);
    if (!byClass.has(cls)) byClass.set(cls, []);
    byClass.get(cls)!.push(test);
  }

  for (const byClass of byProject.values()) {
    for (const [cls, list] of byClass) {
      byClass.set(
        cls,
        [...list].sort((a, b) => getShortName(a).localeCompare(getShortName(b))),
      );
    }
  }

  return byProject;
}

export function sortedProjectKeys(grouped: GroupedTests): string[] {
  return [...grouped.keys()].sort((a, b) => {
    if (a === '—' && b !== '—') return 1;
    if (a !== '—' && b === '—') return -1;
    return a.localeCompare(b);
  });
}

export function getPassRateFromTrends(
  trends: Record<string, TestHistoryEntry> | null,
  fullName: string,
): { rate: number; count: number } | null {
  const entry = trends?.[fullName];
  if (!entry) return null;
  return { rate: entry.passRate, count: entry.runCount };
}
