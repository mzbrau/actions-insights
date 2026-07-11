import { createXmlParser } from '../parsers/xml-parser';
import type {
  CoverageClass,
  CoverageFile,
  CoverageMetrics,
  CoveragePackage,
  CoverageProject,
  CoverageReport,
} from '../model/coverage';
import { aggregateMetricsFromProjects } from '../model/coverage';
import type { CoverageParser } from './types';
import { asArray, attrNumber, attrString, metricsFromCounts, normalizePath, resolveModuleName } from './metrics-helpers';

function sequenceCoverage(metrics: CoverageMetrics, visited: number, numSequencePoints: number): void {
  if (numSequencePoints <= 0) return;
  metrics.totalLines = (metrics.totalLines ?? 0) + numSequencePoints;
  metrics.coveredLines = (metrics.coveredLines ?? 0) + visited;
}

function branchCoverage(metrics: CoverageMetrics, branchPoints: number, visited: number): void {
  if (branchPoints <= 0) return;
  metrics.totalBranches = (metrics.totalBranches ?? 0) + branchPoints;
  metrics.coveredBranches = (metrics.coveredBranches ?? 0) + visited;
}

function finalizeMetrics(metrics: CoverageMetrics): CoverageMetrics {
  const result = { ...metrics };
  if (result.coveredLines !== undefined && result.totalLines !== undefined) {
    result.line = Math.round((result.coveredLines / result.totalLines) * 1000) / 10;
  }
  if (result.coveredBranches !== undefined && result.totalBranches !== undefined) {
    result.branch = Math.round((result.coveredBranches / result.totalBranches) * 1000) / 10;
  }
  if (result.coveredMethods !== undefined && result.totalMethods !== undefined) {
    result.method = Math.round((result.coveredMethods / result.totalMethods) * 1000) / 10;
  }
  return result;
}

function parseOpenCover(content: string, filePath: string): CoverageReport {
  const parser = createXmlParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['Module', 'File', 'Class', 'Method'].includes(name),
  });
  const doc = parser.parse(content) as Record<string, unknown>;
  const coverageSession = doc.CoverageSession as Record<string, unknown> | undefined;
  if (!coverageSession) {
    throw new Error('Missing root <CoverageSession> element');
  }

  const modulesNode = coverageSession.Modules as { Module?: unknown } | undefined;
  const modules = asArray<Record<string, unknown>>(modulesNode?.Module ?? coverageSession.Module);
  const projects: CoverageProject[] = [];

  for (const mod of modules) {
    const moduleName = resolveModuleName(mod, filePath);
    const filesNode = mod.Files as { File?: unknown } | undefined;
    const files = asArray<Record<string, unknown>>(filesNode?.File ?? mod.File);
    const classesNode = mod.Classes as { Class?: unknown } | undefined;
    const classes = asArray<Record<string, unknown>>(classesNode?.Class ?? mod.Class);

    const fileMap = new Map<string, CoverageMetrics>();
    for (const file of files) {
      const uid = attrString(file, 'uid') || '';
      const fullPath = normalizePath(attrString(file, 'fullPath') || uid);
      fileMap.set(uid, { coveredLines: 0, totalLines: 0, coveredBranches: 0, totalBranches: 0 });
      fileMap.set(fullPath, fileMap.get(uid)!);
    }

    const classList: CoverageClass[] = [];
    for (const cls of classes) {
      const clsName = attrString(cls, 'fullname') || attrString(cls, 'name') || 'unknown';
      const fileRef = attrString(cls, 'FileRef') || attrString(cls, 'filename') || '';
      const clsMetrics: CoverageMetrics = { coveredLines: 0, totalLines: 0, coveredMethods: 0, totalMethods: 0 };

      const methods = asArray<Record<string, unknown>>((cls.Methods as { Method?: unknown })?.Method ?? cls.Method);
      for (const method of methods) {
        clsMetrics.totalMethods = (clsMetrics.totalMethods ?? 0) + 1;
        const visited = attrNumber(method, 'visited') ?? 0;
        if (visited > 0) clsMetrics.coveredMethods = (clsMetrics.coveredMethods ?? 0) + 1;

        const seqPoints = asArray<Record<string, unknown>>(
          (method.SequencePoints as { SequencePoint?: unknown })?.SequencePoint ?? method.SequencePoint,
        );
        for (const sp of seqPoints) {
          const vc = attrNumber(sp, 'vc') ?? 0;
          sequenceCoverage(clsMetrics, vc > 0 ? 1 : 0, 1);
          const fileId = attrString(sp, 'fileid') || '';
          const fileMetrics = fileMap.get(fileId);
          if (fileMetrics) sequenceCoverage(fileMetrics, vc > 0 ? 1 : 0, 1);
        }
      }

      classList.push({
        name: clsName,
        file: fileRef ? normalizePath(fileRef) : undefined,
        metrics: finalizeMetrics(clsMetrics),
      });
    }

    const fileList: CoverageFile[] = [];
    const seenPaths = new Set<string>();
    for (const file of files) {
      const fullPath = normalizePath(attrString(file, 'fullPath') || '');
      if (!fullPath || seenPaths.has(fullPath)) continue;
      seenPaths.add(fullPath);
      const uid = attrString(file, 'uid') || '';
      const metrics = finalizeMetrics(fileMap.get(uid) ?? fileMap.get(fullPath) ?? {});
      fileList.push({ path: fullPath, metrics });
    }

    const pkg: CoveragePackage = {
      name: moduleName,
      metrics: {},
      classes: classList,
    };
    let modCoveredLines = 0;
    let modTotalLines = 0;
    let modCoveredBranches = 0;
    let modTotalBranches = 0;
    for (const f of fileList) {
      modCoveredLines += f.metrics.coveredLines ?? 0;
      modTotalLines += f.metrics.totalLines ?? 0;
      modCoveredBranches += f.metrics.coveredBranches ?? 0;
      modTotalBranches += f.metrics.totalBranches ?? 0;
    }
    pkg.metrics = metricsFromCounts(modCoveredLines, modTotalLines, modCoveredBranches, modTotalBranches);

    projects.push({
      name: moduleName,
      metrics: pkg.metrics,
      packages: [pkg],
      files: fileList,
    });
  }

  return {
    summary: aggregateMetricsFromProjects(projects),
    projects,
    sourceFiles: [filePath],
  };
}

export const opencoverParser: CoverageParser = {
  format: 'opencover',
  canParse(filePath, peek) {
    const lower = filePath.toLowerCase();
    if (lower.includes('opencover') || lower.endsWith('.opencover.xml')) return true;
    return peek.includes('<CoverageSession') || peek.includes('OpenCover');
  },
  parse: parseOpenCover,
};
