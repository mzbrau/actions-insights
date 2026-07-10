import type {
  CoverageClass,
  CoverageFile,
  CoverageMetrics,
  CoveragePackage,
  CoverageProject,
  CoverageReport,
} from '../model/coverage';
import { aggregateMetricsFromProjects, mergeMetrics } from '../model/coverage';

function mergeClasses(existing: CoverageClass[], incoming: CoverageClass[]): CoverageClass[] {
  const map = new Map<string, CoverageClass>();
  for (const cls of existing) {
    map.set(`${cls.name}\0${cls.file ?? ''}`, cls);
  }
  for (const cls of incoming) {
    const key = `${cls.name}\0${cls.file ?? ''}`;
    const prior = map.get(key);
    map.set(key, prior ? { ...cls, metrics: mergeMetrics(prior.metrics, cls.metrics) } : cls);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function mergePackages(existing: CoveragePackage[], incoming: CoveragePackage[]): CoveragePackage[] {
  const map = new Map<string, CoveragePackage>();
  for (const pkg of existing) {
    map.set(pkg.name, pkg);
  }
  for (const pkg of incoming) {
    const prior = map.get(pkg.name);
    if (!prior) {
      map.set(pkg.name, pkg);
      continue;
    }
    map.set(pkg.name, {
      name: pkg.name,
      metrics: mergeMetrics(prior.metrics, pkg.metrics),
      classes: mergeClasses(prior.classes ?? [], pkg.classes ?? []),
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function mergeFiles(existing: CoverageFile[], incoming: CoverageFile[]): CoverageFile[] {
  const map = new Map<string, CoverageFile>();
  for (const file of existing) {
    map.set(file.path, file);
  }
  for (const file of incoming) {
    const prior = map.get(file.path);
    map.set(file.path, prior ? { path: file.path, metrics: mergeMetrics(prior.metrics, file.metrics) } : file);
  }
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function mergeProjects(existing: CoverageProject[], incoming: CoverageProject[]): CoverageProject[] {
  const map = new Map<string, CoverageProject>();
  for (const project of existing) {
    map.set(project.name, project);
  }
  for (const project of incoming) {
    const prior = map.get(project.name);
    if (!prior) {
      map.set(project.name, project);
      continue;
    }
    map.set(project.name, {
      name: project.name,
      metrics: mergeMetrics(prior.metrics, project.metrics),
      packages: mergePackages(prior.packages ?? [], project.packages ?? []),
      files: mergeFiles(prior.files ?? [], project.files ?? []),
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeCoverageReports(reports: CoverageReport[]): CoverageReport {
  if (reports.length === 0) {
    return { summary: {}, projects: [], sourceFiles: [] };
  }
  if (reports.length === 1) {
    return reports[0];
  }

  let projects: CoverageProject[] = [];
  const sourceFiles: string[] = [];
  const matchedFiles: string[] = [];
  const errors = reports.flatMap((r) => r.errors ?? []);

  for (const report of reports) {
    projects = mergeProjects(projects, report.projects);
    sourceFiles.push(...report.sourceFiles);
    if (report.matchedFiles) matchedFiles.push(...report.matchedFiles);
  }

  return {
    summary: aggregateMetricsFromProjects(projects),
    projects,
    sourceFiles: [...new Set(sourceFiles)],
    matchedFiles: matchedFiles.length > 0 ? [...new Set(matchedFiles)] : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export function emptyCoverageReport(sourceFile: string): CoverageReport {
  return {
    summary: {},
    projects: [],
    sourceFiles: [sourceFile],
  };
}

export function metricsPercentConflict(a: CoverageMetrics, b: CoverageMetrics, tolerance = 0.5): boolean {
  const keys: Array<keyof CoverageMetrics> = ['line', 'branch', 'method', 'class', 'file'];
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number' && Math.abs(av - bv) > tolerance) {
      return true;
    }
  }
  return false;
}
