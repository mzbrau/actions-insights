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

export interface CoverageMethodRow {
  label: string;
  title?: string;
  metrics: CoverageMetrics;
}

export type CoverageMethodSortBy = CoverageFileSortBy;

export function formatMethodLabel(name: string, signature?: string): string {
  if (signature) {
    const trimmed = signature.startsWith('(') ? signature : `(${signature})`;
    return `${name}${trimmed}`;
  }
  return name;
}

function classesForFile(
  project: CompactCoverageProject,
  filePath: string,
  pkgFilter?: NonNullable<CompactCoverageProject['packages']>[number],
): Array<{ className: string; methods: NonNullable<NonNullable<CompactCoverageProject['packages']>[number]['classes']>[number]['methods'] }> {
  const packages = pkgFilter ? [pkgFilter] : (project.packages ?? []);
  const result: Array<{ className: string; methods: NonNullable<NonNullable<CompactCoverageProject['packages']>[number]['classes']>[number]['methods'] }> = [];

  for (const pkg of packages) {
    for (const cls of pkg.classes ?? []) {
      if (cls.file !== filePath || !cls.methods?.length) continue;
      result.push({ className: cls.name, methods: cls.methods });
    }
  }

  return result;
}

export function collectFileMethods(
  filePath: string,
  project: CompactCoverageProject,
  pkgFilter?: NonNullable<CompactCoverageProject['packages']>[number],
): CoverageMethodRow[] {
  const classGroups = classesForFile(project, filePath, pkgFilter);
  const multipleClasses = classGroups.length > 1;
  const rows: CoverageMethodRow[] = [];

  for (const { className, methods } of classGroups) {
    const shortClass = className.includes('.') ? className.slice(className.lastIndexOf('.') + 1) : className;
    for (const method of methods ?? []) {
      const baseLabel = formatMethodLabel(method.name, method.signature);
      const label = multipleClasses ? `${shortClass}.${baseLabel}` : baseLabel;
      rows.push({
        label,
        title: multipleClasses ? `${className}::${baseLabel}` : baseLabel,
        metrics: method.metrics,
      });
    }
  }

  return rows;
}

export function filterCoverageMethods(methods: CoverageMethodRow[], search: string): CoverageMethodRow[] {
  const q = search.trim().toLowerCase();
  if (!q) return methods;
  return methods.filter((method) =>
    method.label.toLowerCase().includes(q) || (method.title?.toLowerCase().includes(q) ?? false),
  );
}

export function sortCoverageMethods(
  methods: CoverageMethodRow[],
  sortBy: CoverageMethodSortBy,
): CoverageMethodRow[] {
  const sorted = [...methods];
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
        return a.label.localeCompare(b.label);
    }
  });
  return sorted;
}

export interface CoverageGapsScope {
  title: string;
  lineCoverage?: number;
  files: CoverageFileRow[];
  methodsByFile: Map<string, CoverageMethodRow[]>;
}

export function buildProjectGapsScope(
  project: CompactCoverageProject,
  detail: CoverageRunRecord | null,
  pkgFilter?: NonNullable<CompactCoverageProject['packages']>[number],
): CoverageGapsScope {
  const files = pkgFilter
    ? collectPackageFiles(pkgFilter, detail)
    : collectProjectFiles(project, detail);

  const methodsByFile = new Map<string, CoverageMethodRow[]>();
  for (const file of files) {
    const methods = collectFileMethods(file.path, project, pkgFilter);
    if (methods.length > 0) methodsByFile.set(file.path, methods);
  }

  return {
    title: project.name,
    lineCoverage: project.metrics.line,
    files,
    methodsByFile,
  };
}

export function buildFileGapsScope(
  file: CoverageFileRow,
  project: CompactCoverageProject,
  pkgFilter?: NonNullable<CompactCoverageProject['packages']>[number],
): CoverageGapsScope {
  const methods = collectFileMethods(file.path, project, pkgFilter);
  const methodsByFile = new Map<string, CoverageMethodRow[]>();
  if (methods.length > 0) methodsByFile.set(file.path, methods);

  return {
    title: fileBasename(file.path),
    lineCoverage: file.metrics.line,
    files: [file],
    methodsByFile,
  };
}

function linePct(metrics: CoverageMetrics): number | undefined {
  return metrics.line;
}

export function countGaps(scope: CoverageGapsScope, threshold: number): { fileCount: number; methodCount: number } {
  let fileCount = 0;
  let methodCount = 0;

  for (const file of scope.files) {
    const line = linePct(file.metrics);
    const methods = scope.methodsByFile.get(file.path) ?? [];
    const gapMethods = methods.filter((m) => {
      const pct = linePct(m.metrics);
      return pct !== undefined && pct < threshold;
    });

    const fileBelow = line !== undefined && line < threshold;
    if (fileBelow || gapMethods.length > 0) fileCount += 1;
    methodCount += gapMethods.length;
  }

  return { fileCount, methodCount };
}

export function formatCoverageGapsSummary(scope: CoverageGapsScope, threshold: number): string {
  const lines: string[] = [];
  const header = scope.lineCoverage !== undefined
    ? `Coverage gaps — ${scope.title} (${scope.lineCoverage.toFixed(1)}% line coverage)`
    : `Coverage gaps — ${scope.title}`;
  lines.push(header);
  lines.push(`Threshold: ${threshold}%`);
  lines.push('');

  const fileEntries = scope.files
    .map((file) => {
      const line = linePct(file.metrics);
      const methods = scope.methodsByFile.get(file.path) ?? [];
      const gapMethods = methods
        .filter((m) => {
          const pct = linePct(m.metrics);
          return pct !== undefined && pct < threshold;
        })
        .sort((a, b) => metricValue(a.metrics, 'line') - metricValue(b.metrics, 'line'));

      const fileBelow = line !== undefined && line < threshold;
      if (!fileBelow && gapMethods.length === 0) return null;

      return { file, line, gapMethods, fileBelow };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => metricValue(a.file.metrics, 'line') - metricValue(b.file.metrics, 'line'));

  if (fileEntries.length === 0) {
    lines.push('No coverage gaps at this threshold.');
    return lines.join('\n');
  }

  for (const { file, line, gapMethods, fileBelow } of fileEntries) {
    const fileHeader = line !== undefined ? `${file.path} (${line.toFixed(1)}%)` : file.path;
    lines.push(fileHeader);
    for (const method of gapMethods) {
      const pct = linePct(method.metrics);
      lines.push(`  - ${method.label} (${pct!.toFixed(1)}%)`);
    }
    if (gapMethods.length === 0 && fileBelow) {
      lines.push('  - (no method breakdown available)');
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function fileBasename(path: string): string {
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
}
