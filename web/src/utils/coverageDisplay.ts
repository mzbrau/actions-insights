import type {
  CompactCoverageProject,
  CoverageMetrics,
  CoverageRunRecord,
} from '@actions-insights/history-models';

export interface CoverageFileRow {
  path: string;
  metrics: CoverageMetrics;
}

export type CoverageFileSortBy =
  | 'name'
  | 'line-asc'
  | 'line-desc'
  | 'branch-asc'
  | 'branch-desc';

export function coverageBarColor(pct: number): string {
  const clamped = Math.min(100, Math.max(0, pct));
  const hue = (clamped / 100) * 120;
  return `hsl(${hue}, 65%, 45%)`;
}

export function shouldFlattenPackages(project: CompactCoverageProject): boolean {
  const packages = project.packages ?? [];
  return packages.length === 1 && packages[0].name === project.name;
}

export function collectProjectFiles(
  project: CompactCoverageProject,
  detail: CoverageRunRecord | null,
): CoverageFileRow[] {
  if (project.files?.length && detail?.paths) {
    const rows: CoverageFileRow[] = [];
    for (const entry of project.files) {
      const path = detail.paths[entry.p];
      if (path) rows.push({ path, metrics: entry.metrics });
    }
    if (rows.length > 0) return rows;
  }

  const classPaths = new Set<string>();
  for (const pkg of project.packages ?? []) {
    for (const cls of pkg.classes ?? []) {
      if (cls.file) classPaths.add(cls.file);
    }
  }

  if (classPaths.size > 0 && detail?.files && detail.paths) {
    const metricsByPath = new Map<string, CoverageMetrics>();
    for (const entry of detail.files) {
      const path = detail.paths[entry.p];
      if (path) metricsByPath.set(path, entry.metrics);
    }
    return [...classPaths].map((path) => ({
      path,
      metrics: metricsByPath.get(path) ?? {},
    }));
  }

  if (detail?.projects.length === 1 && detail.files && detail.paths) {
    return detail.files
      .map((entry) => {
        const path = detail.paths![entry.p];
        if (!path) return undefined;
        return { path, metrics: entry.metrics };
      })
      .filter((row): row is CoverageFileRow => row !== undefined);
  }

  return [];
}

export function collectPackageFiles(
  pkg: NonNullable<CompactCoverageProject['packages']>[number],
  detail: CoverageRunRecord | null,
): CoverageFileRow[] {
  const classPaths = new Set<string>();
  for (const cls of pkg.classes ?? []) {
    if (cls.file) classPaths.add(cls.file);
  }

  if (classPaths.size === 0) return [];

  if (detail?.files && detail.paths) {
    const metricsByPath = new Map<string, CoverageMetrics>();
    for (const entry of detail.files) {
      const path = detail.paths[entry.p];
      if (path) metricsByPath.set(path, entry.metrics);
    }
    return [...classPaths].map((path) => ({
      path,
      metrics: metricsByPath.get(path) ?? {},
    }));
  }

  return [...classPaths].map((path) => ({ path, metrics: {} }));
}

export function filterCoverageFiles(files: CoverageFileRow[], search: string): CoverageFileRow[] {
  const q = search.trim().toLowerCase();
  if (!q) return files;
  return files.filter((file) => file.path.toLowerCase().includes(q));
}

function metricValue(metrics: CoverageMetrics, key: 'line' | 'branch'): number {
  const value = metrics[key];
  return value ?? -1;
}

export function sortCoverageFiles(
  files: CoverageFileRow[],
  sortBy: CoverageFileSortBy,
): CoverageFileRow[] {
  const sorted = [...files];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'line-asc':
        return metricValue(a.metrics, 'line') - metricValue(b.metrics, 'line');
      case 'line-desc':
        return metricValue(b.metrics, 'line') - metricValue(a.metrics, 'line');
      case 'branch-asc':
        return metricValue(a.metrics, 'branch') - metricValue(b.metrics, 'branch');
      case 'branch-desc':
        return metricValue(b.metrics, 'branch') - metricValue(a.metrics, 'branch');
      case 'name':
      default:
        return a.path.localeCompare(b.path);
    }
  });
  return sorted;
}

export function fileBasename(path: string): string {
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
}
