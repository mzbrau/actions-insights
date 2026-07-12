import { createXmlParser } from '../parsers/xml-parser';
import type {
  CoverageClass,
  CoverageFile,
  CoverageMethod,
  CoverageMetrics,
  CoveragePackage,
  CoverageProject,
  CoverageReport,
} from '../model/coverage';
import { aggregateMetricsFromProjects } from '../model/coverage';
import type { CoverageParser } from './types';
import {
  asArray,
  attrNumber,
  attrString,
  metricsFromCounts,
  normalizePath,
  parseRate,
  resolveProjectNameFromPath,
} from './metrics-helpers';

function lineMetricsFromCoberturaLines(lines: Record<string, unknown>[]): CoverageMetrics {
  let coveredLines = 0;
  let totalLines = 0;
  let coveredBranches = 0;
  let totalBranches = 0;

  for (const line of lines) {
    const hits = attrNumber(line, 'hits');
    const branch = attrString(line, 'branch');
    if (hits === undefined) continue;
    totalLines += 1;
    if (hits > 0) coveredLines += 1;
    if (branch === 'true') {
      const conditionCoverage = attrString(line, 'condition-coverage');
      if (conditionCoverage) {
        const match = conditionCoverage.match(/(\d+)\s*%\s*\((\d+)\/(\d+)\)/);
        if (match) {
          coveredBranches += Number.parseInt(match[2], 10);
          totalBranches += Number.parseInt(match[3], 10);
        }
      }
    }
  }

  return metricsFromCounts(coveredLines, totalLines, coveredBranches, totalBranches);
}

function lineMetricsFromCoberturaClass(node: Record<string, unknown>): CoverageMetrics {
  const lines = asArray<Record<string, unknown>>((node.lines as { line?: unknown })?.line);
  const lineRate = parseRate(attrString(node, 'line-rate') ?? attrNumber(node, 'line-rate'));
  const branchRate = parseRate(attrString(node, 'branch-rate') ?? attrNumber(node, 'branch-rate'));

  const metrics = lineMetricsFromCoberturaLines(lines);
  if (lineRate !== undefined && metrics.line === undefined) metrics.line = lineRate;
  if (branchRate !== undefined && metrics.branch === undefined) metrics.branch = branchRate;
  return metrics;
}

function methodsFromCoberturaClass(node: Record<string, unknown>): CoverageMethod[] {
  const methodsNode = node.methods as { method?: unknown } | undefined;
  const methods = asArray<Record<string, unknown>>(methodsNode?.method);
  const result: CoverageMethod[] = [];

  for (const method of methods) {
    const name = attrString(method, 'name') || 'unknown';
    const signature = attrString(method, 'signature') || undefined;
    const lines = asArray<Record<string, unknown>>((method.lines as { line?: unknown })?.line);
    const lineRate = parseRate(attrString(method, 'line-rate') ?? attrNumber(method, 'line-rate'));
    const branchRate = parseRate(attrString(method, 'branch-rate') ?? attrNumber(method, 'branch-rate'));

    const metrics = lines.length > 0
      ? lineMetricsFromCoberturaLines(lines)
      : metricsFromCounts(undefined, undefined, undefined, undefined);
    if (lineRate !== undefined && metrics.line === undefined) metrics.line = lineRate;
    if (branchRate !== undefined && metrics.branch === undefined) metrics.branch = branchRate;

    result.push({ name, ...(signature ? { signature } : {}), metrics });
  }

  return result;
}

function aggregateFromFiles(files: CoverageFile[]): CoverageMetrics {
  let coveredLines = 0;
  let totalLines = 0;
  let coveredBranches = 0;
  let totalBranches = 0;
  for (const file of files) {
    coveredLines += file.metrics.coveredLines ?? 0;
    totalLines += file.metrics.totalLines ?? 0;
    coveredBranches += file.metrics.coveredBranches ?? 0;
    totalBranches += file.metrics.totalBranches ?? 0;
  }
  return metricsFromCounts(coveredLines, totalLines, coveredBranches, totalBranches);
}

function aggregateClassMetrics(classes: CoverageClass[]): CoverageMetrics {
  let coveredLines = 0;
  let totalLines = 0;
  let coveredBranches = 0;
  let totalBranches = 0;
  for (const cls of classes) {
    coveredLines += cls.metrics.coveredLines ?? 0;
    totalLines += cls.metrics.totalLines ?? 0;
    coveredBranches += cls.metrics.coveredBranches ?? 0;
    totalBranches += cls.metrics.totalBranches ?? 0;
  }
  return metricsFromCounts(coveredLines, totalLines, coveredBranches, totalBranches, undefined, undefined, classes.length, classes.length);
}

function parseCobertura(content: string, filePath: string): CoverageReport {
  const parser = createXmlParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['package', 'class', 'line', 'method'].includes(name),
  });
  const doc = parser.parse(content) as Record<string, unknown>;
  const coverage = (doc.coverage ?? doc.Coverage) as Record<string, unknown> | undefined;
  if (!coverage) {
    throw new Error('Missing root <coverage> element');
  }

  const packagesNode = coverage.packages as { package?: unknown } | undefined;
  const packages = asArray<Record<string, unknown>>(packagesNode?.package);
  const pathFallback = resolveProjectNameFromPath(filePath);
  const projects: CoverageProject[] = [];

  for (const pkg of packages) {
    const pkgName = attrString(pkg, 'name') || pathFallback || 'default';
    const classesNode = pkg.classes as { class?: unknown } | undefined;
    const classes = asArray<Record<string, unknown>>(classesNode?.class);
    const classList: CoverageClass[] = [];
    const files: CoverageFile[] = [];

    for (const cls of classes) {
      const clsName = attrString(cls, 'name') || 'unknown';
      const filename = normalizePath(attrString(cls, 'filename') || '');
      const metrics = lineMetricsFromCoberturaClass(cls);
      const classMethods = methodsFromCoberturaClass(cls);
      classList.push({
        name: clsName,
        file: filename || undefined,
        metrics,
        ...(classMethods.length > 0 ? { methods: classMethods } : {}),
      });
      if (filename) {
        files.push({ path: filename, metrics });
      }
    }

    const pkgMetrics = aggregateClassMetrics(classList);
    const pkgEntry: CoveragePackage = { name: pkgName, metrics: pkgMetrics, classes: classList };

    projects.push({
      name: pkgName,
      metrics: aggregateFromFiles(files),
      packages: [pkgEntry],
      files,
    });
  }

  const rootLineRate = parseRate(attrString(coverage, 'line-rate') ?? attrNumber(coverage, 'line-rate'));
  const rootBranchRate = parseRate(attrString(coverage, 'branch-rate') ?? attrNumber(coverage, 'branch-rate'));

  if (projects.length === 0) {
    projects.push({
      name: pathFallback ?? 'default',
      metrics: {},
      packages: [],
      files: [],
    });
  }

  if (rootLineRate !== undefined || rootBranchRate !== undefined) {
    for (const project of projects) {
      if (projects.length === 1) {
        if (rootLineRate !== undefined && project.metrics.line === undefined) {
          project.metrics = { ...project.metrics, line: rootLineRate };
        }
        if (rootBranchRate !== undefined && project.metrics.branch === undefined) {
          project.metrics = { ...project.metrics, branch: rootBranchRate };
        }
      }
    }
  }

  return {
    summary: aggregateMetricsFromProjects(projects),
    projects,
    sourceFiles: [filePath],
  };
}

export const coberturaParser: CoverageParser = {
  format: 'cobertura',
  canParse(filePath, peek) {
    const lower = filePath.toLowerCase();
    if (lower.includes('cobertura') || lower.endsWith('.cobertura.xml')) return true;
    return peek.includes('<coverage') && !peek.includes('report name=') && !peek.includes('OpenCover');
  },
  parse: parseCobertura,
};
