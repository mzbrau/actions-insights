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
import { asArray, attrNumber, attrString, metricsFromCounts, normalizePath, parseRate } from './metrics-helpers';

function countersFromJaCoCo(node: Record<string, unknown>): CoverageMetrics {
  const counters = asArray<Record<string, unknown>>((node.counter as unknown) ?? []);
  let coveredLines = 0;
  let totalLines = 0;
  let coveredBranches = 0;
  let totalBranches = 0;
  let coveredMethods = 0;
  let totalMethods = 0;
  let coveredClasses = 0;
  let totalClasses = 0;

  for (const counter of counters) {
    const type = attrString(counter, 'type')?.toUpperCase();
    const covered = attrNumber(counter, 'covered') ?? 0;
    const missed = attrNumber(counter, 'missed') ?? 0;
    const total = covered + missed;
    switch (type) {
      case 'LINE':
        coveredLines += covered;
        totalLines += total;
        break;
      case 'BRANCH':
        coveredBranches += covered;
        totalBranches += total;
        break;
      case 'METHOD':
        coveredMethods += covered;
        totalMethods += total;
        break;
      case 'CLASS':
        coveredClasses += covered;
        totalClasses += total;
        break;
      default:
        break;
    }
  }

  return metricsFromCounts(
    totalLines > 0 ? coveredLines : undefined,
    totalLines > 0 ? totalLines : undefined,
    totalBranches > 0 ? coveredBranches : undefined,
    totalBranches > 0 ? totalBranches : undefined,
    totalMethods > 0 ? coveredMethods : undefined,
    totalMethods > 0 ? totalMethods : undefined,
    totalClasses > 0 ? coveredClasses : undefined,
    totalClasses > 0 ? totalClasses : undefined,
  );
}

function parseJaCoCo(content: string, filePath: string): CoverageReport {
  const parser = createXmlParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['package', 'class', 'sourcefile', 'line', 'counter', 'sessioninfo', 'method'].includes(name),
  });
  const doc = parser.parse(content) as Record<string, unknown>;
  const report = (doc.report ?? doc.Report) as Record<string, unknown> | undefined;
  if (!report) {
    throw new Error('Missing root <report> element');
  }

  const projectName = attrString(report, 'name') || filePath.split(/[/\\]/).slice(-2, -1)[0] || 'default';
  const packages = asArray<Record<string, unknown>>((report.package as unknown) ?? []);
  const pkgList: CoveragePackage[] = [];
  const files: CoverageFile[] = [];

  for (const pkg of packages) {
    const pkgName = attrString(pkg, 'name') || 'default';
    const classes = asArray<Record<string, unknown>>((pkg.class as unknown) ?? []);
    const sourcefiles = asArray<Record<string, unknown>>((pkg.sourcefile as unknown) ?? []);
    const classList: CoverageClass[] = [];

    for (const cls of classes) {
      const clsName = attrString(cls, 'name') || 'unknown';
      const sourceFile = attrString(cls, 'sourcefilename');
      const classMethods = asArray<Record<string, unknown>>((cls.method as unknown) ?? []);
      const methods: CoverageMethod[] = classMethods.map((method) => {
        const name = attrString(method, 'name') || 'unknown';
        const desc = attrString(method, 'desc') || undefined;
        return {
          name,
          ...(desc ? { signature: desc } : {}),
          metrics: countersFromJaCoCo(method),
        };
      });

      classList.push({
        name: clsName,
        file: sourceFile ? normalizePath(sourceFile) : undefined,
        metrics: countersFromJaCoCo(cls),
        ...(methods.length > 0 ? { methods } : {}),
      });
    }

    for (const sf of sourcefiles) {
      const sfName = normalizePath(attrString(sf, 'name') || 'unknown');
      files.push({ path: sfName, metrics: countersFromJaCoCo(sf) });
    }

    const pkgMetrics = countersFromJaCoCo(pkg);
    pkgList.push({ name: pkgName, metrics: pkgMetrics, classes: classList });
  }

  const project: CoverageProject = {
    name: projectName,
    metrics: countersFromJaCoCo(report),
    packages: pkgList,
    files,
  };

  const projects = [project];
  return {
    summary: aggregateMetricsFromProjects(projects),
    projects,
    sourceFiles: [filePath],
  };
}

export const jacocoParser: CoverageParser = {
  format: 'jacoco',
  canParse(filePath, peek) {
    const lower = filePath.toLowerCase();
    if (lower.includes('jacoco') || lower.endsWith('jacoco.xml')) return true;
    return peek.includes('<report') && peek.includes('counter') && peek.includes('LINE');
  },
  parse: parseJaCoCo,
};
