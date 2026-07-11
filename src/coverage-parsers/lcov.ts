import type {
  CoverageFile,
  CoverageMetrics,
  CoverageProject,
  CoverageReport,
} from '../model/coverage';
import { aggregateMetricsFromProjects } from '../model/coverage';
import type { CoverageParser } from './types';
import { metricsFromCounts, normalizePath, deriveProjectNameFromSourcePaths, resolveProjectNameFromPath } from './metrics-helpers';

interface LcovFileState {
  path: string;
  coveredLines: number;
  totalLines: number;
  coveredBranches: number;
  totalBranches: number;
}

function parseLcovRecord(lines: string[], startIndex: number): { state: LcovFileState; nextIndex: number } | undefined {
  let i = startIndex;
  let path = '';
  const lineHits = new Map<number, number>();
  let coveredBranches = 0;
  let totalBranches = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    i += 1;
    if (!line) continue;
    if (line === 'end_of_record') break;

    if (line.startsWith('SF:')) {
      path = normalizePath(line.slice(3));
    } else if (line.startsWith('DA:')) {
      const parts = line.slice(3).split(',');
      const hitsVal = Number.parseInt(parts[1] ?? '0', 10);
      const lineNum = Number.parseInt(parts[0] ?? '0', 10);
      if (Number.isFinite(lineNum)) {
        lineHits.set(lineNum, Number.isFinite(hitsVal) ? hitsVal : 0);
      }
    } else if (line.startsWith('BRDA:')) {
      totalBranches += 1;
      const parts = line.slice(5).split(',');
      const hits = parts[3] === '-' ? 0 : Number.parseInt(parts[3] ?? '0', 10);
      if (hits > 0) coveredBranches += 1;
    }
  }

  if (!path) return undefined;

  let coveredLines = 0;
  for (const hits of lineHits.values()) {
    if (hits > 0) coveredLines += 1;
  }
  const totalLines = lineHits.size;

  return {
    state: { path, coveredLines, totalLines, coveredBranches, totalBranches },
    nextIndex: i,
  };
}

function parseLcov(content: string, filePath: string): CoverageReport {
  const lines = content.split(/\r?\n/);
  const files: CoverageFile[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('SF:')) {
      const record = parseLcovRecord(lines, i);
      if (record) {
        files.push({
          path: record.state.path,
          metrics: metricsFromCounts(
            record.state.coveredLines,
            record.state.totalLines,
            record.state.coveredBranches,
            record.state.totalBranches,
          ),
        });
        i = record.nextIndex;
        continue;
      }
    }
    i += 1;
  }

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

  const projectName = resolveProjectNameFromPath(filePath)
    ?? deriveProjectNameFromSourcePaths(files.map((f) => f.path));
  const project: CoverageProject = {
    name: projectName,
    metrics: metricsFromCounts(coveredLines, totalLines, coveredBranches, totalBranches, undefined, undefined, undefined, undefined, files.filter((f) => (f.metrics.coveredLines ?? 0) > 0).length, files.length),
    files,
  };

  const projects = [project];
  return {
    summary: aggregateMetricsFromProjects(projects),
    projects,
    sourceFiles: [filePath],
  };
}

export const lcovParser: CoverageParser = {
  format: 'lcov',
  canParse(filePath, peek) {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.lcov') || lower.endsWith('.info') || lower.includes('lcov')) return true;
    return peek.includes('SF:') && peek.includes('end_of_record');
  },
  parse: parseLcov,
};
