import { HISTORY_SCHEMA_VERSION } from './index';

export interface CoverageMetrics {
  line?: number;
  branch?: number;
  method?: number;
  class?: number;
  file?: number;
  coveredLines?: number;
  totalLines?: number;
  coveredBranches?: number;
  totalBranches?: number;
  coveredMethods?: number;
  totalMethods?: number;
  coveredClasses?: number;
  totalClasses?: number;
  coveredFiles?: number;
  totalFiles?: number;
}

export interface CoverageSummary extends CoverageMetrics {}

export interface CoverageFile {
  path: string;
  metrics: CoverageMetrics;
}

export interface CoverageClass {
  name: string;
  file?: string;
  metrics: CoverageMetrics;
}

export interface CoveragePackage {
  name: string;
  metrics: CoverageMetrics;
  classes?: CoverageClass[];
}

export interface CoverageProject {
  name: string;
  metrics: CoverageMetrics;
  packages?: CoveragePackage[];
  files?: CoverageFile[];
}

export interface CoverageParseError {
  file: string;
  message: string;
}

export interface CoverageReport {
  summary: CoverageSummary;
  projects: CoverageProject[];
  sourceFiles: string[];
  matchedFiles?: string[];
  errors?: CoverageParseError[];
}

export interface CoverageSummaryCompact extends CoverageMetrics {
  projects?: Record<string, CoverageMetrics>;
}

export interface CompactCoverageProject {
  name: string;
  metrics: CoverageMetrics;
  packages?: Array<{
    name: string;
    metrics: CoverageMetrics;
    classes?: Array<{ name: string; file?: string; metrics: CoverageMetrics }>;
  }>;
}

export interface CompactCoverageFile {
  p: number;
  metrics: CoverageMetrics;
}

export interface CoverageRunRecord {
  version: typeof HISTORY_SCHEMA_VERSION;
  runId: string;
  summary: CoverageSummaryCompact;
  projects: CompactCoverageProject[];
  paths?: string[];
  files?: CompactCoverageFile[];
}

export function percentFromCounts(covered: number, total: number): number | undefined {
  if (total <= 0) return undefined;
  return Math.round((covered / total) * 1000) / 10;
}

export function mergeMetrics(a: CoverageMetrics, b: CoverageMetrics): CoverageMetrics {
  const result: CoverageMetrics = {};

  const sumPair = (
    keyCovered: keyof CoverageMetrics,
    keyTotal: keyof CoverageMetrics,
    keyPct: keyof CoverageMetrics,
  ): void => {
    const ca = a[keyCovered];
    const ta = a[keyTotal];
    const cb = b[keyCovered];
    const tb = b[keyTotal];
    if (typeof ca === 'number' && typeof ta === 'number' && typeof cb === 'number' && typeof tb === 'number') {
      const covered = ca + cb;
      const total = ta + tb;
      (result[keyCovered] as number) = covered;
      (result[keyTotal] as number) = total;
      const pct = percentFromCounts(covered, total);
      if (pct !== undefined) (result[keyPct] as number) = pct;
    } else if (typeof ca === 'number' && typeof ta === 'number' && cb === undefined && tb === undefined) {
      (result[keyCovered] as number) = ca;
      (result[keyTotal] as number) = ta;
      const pct = percentFromCounts(ca, ta);
      if (pct !== undefined) (result[keyPct] as number) = pct;
    } else if (typeof cb === 'number' && typeof tb === 'number' && ca === undefined && ta === undefined) {
      (result[keyCovered] as number) = cb;
      (result[keyTotal] as number) = tb;
      const pct = percentFromCounts(cb, tb);
      if (pct !== undefined) (result[keyPct] as number) = pct;
    }
  };

  sumPair('coveredLines', 'totalLines', 'line');
  sumPair('coveredBranches', 'totalBranches', 'branch');
  sumPair('coveredMethods', 'totalMethods', 'method');
  sumPair('coveredClasses', 'totalClasses', 'class');
  sumPair('coveredFiles', 'totalFiles', 'file');

  return result;
}

export function aggregateMetricsFromProjects(projects: CoverageProject[]): CoverageSummary {
  let summary: CoverageMetrics = {};
  for (const project of projects) {
    summary = mergeMetrics(summary, project.metrics);
  }
  return summary;
}

export function toCoverageSummaryCompact(report: CoverageReport): CoverageSummaryCompact {
  const projects: Record<string, CoverageMetrics> = {};
  for (const project of report.projects) {
    projects[project.name] = { ...project.metrics };
  }
  return {
    ...report.summary,
    projects,
  };
}

export function encodeCoverageRunRecord(
  runId: string,
  report: CoverageReport,
): CoverageRunRecord {
  const paths: string[] = [];
  const pathIndex = new Map<string, number>();
  const files: CompactCoverageFile[] = [];

  const indexPath = (filePath: string): number => {
    const existing = pathIndex.get(filePath);
    if (existing !== undefined) return existing;
    const idx = paths.length;
    paths.push(filePath);
    pathIndex.set(filePath, idx);
    return idx;
  };

  for (const project of report.projects) {
    for (const file of project.files ?? []) {
      files.push({ p: indexPath(file.path), metrics: file.metrics });
    }
  }

  const projects: CompactCoverageProject[] = report.projects.map((project) => ({
    name: project.name,
    metrics: project.metrics,
    packages: project.packages?.map((pkg) => ({
      name: pkg.name,
      metrics: pkg.metrics,
      classes: pkg.classes?.map((cls) => ({
        name: cls.name,
        file: cls.file,
        metrics: cls.metrics,
      })),
    })),
  }));

  return {
    version: HISTORY_SCHEMA_VERSION,
    runId,
    summary: toCoverageSummaryCompact(report),
    projects,
    ...(paths.length > 0 ? { paths } : {}),
    ...(files.length > 0 ? { files } : {}),
  };
}

export function decodeCoverageRunRecord(record: CoverageRunRecord): CoverageReport {
  const projects: CoverageProject[] = record.projects.map((project) => {
    const pkgMap = new Map<string, CoveragePackage>();
    for (const pkg of project.packages ?? []) {
      pkgMap.set(pkg.name, {
        name: pkg.name,
        metrics: pkg.metrics,
        classes: pkg.classes?.map((cls) => ({
          name: cls.name,
          file: cls.file,
          metrics: cls.metrics,
        })),
      });
    }

    const projectFiles: CoverageFile[] = [];
    if (record.files && record.paths) {
      for (const entry of record.files) {
        const filePath = record.paths[entry.p];
        if (!filePath) continue;
        projectFiles.push({ path: filePath, metrics: entry.metrics });
      }
    }

    return {
      name: project.name,
      metrics: project.metrics,
      packages: [...pkgMap.values()],
      ...(projectFiles.length > 0 ? { files: projectFiles } : {}),
    };
  });

  return {
    summary: { ...record.summary },
    projects,
    sourceFiles: [],
  };
}

export function normalizeCoverageRunRecord(raw: unknown): CoverageRunRecord {
  const record = raw as CoverageRunRecord;
  return {
    version: HISTORY_SCHEMA_VERSION,
    runId: record.runId,
    summary: record.summary ?? {},
    projects: record.projects ?? [],
    paths: record.paths,
    files: record.files,
  };
}
