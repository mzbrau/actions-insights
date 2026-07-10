import type { CoverageMetrics } from '../model/coverage';
import { percentFromCounts } from '../model/coverage';

export function metricsFromCounts(
  coveredLines?: number,
  totalLines?: number,
  coveredBranches?: number,
  totalBranches?: number,
  coveredMethods?: number,
  totalMethods?: number,
  coveredClasses?: number,
  totalClasses?: number,
  coveredFiles?: number,
  totalFiles?: number,
): CoverageMetrics {
  const metrics: CoverageMetrics = {};
  if (coveredLines !== undefined && totalLines !== undefined) {
    metrics.coveredLines = coveredLines;
    metrics.totalLines = totalLines;
    const pct = percentFromCounts(coveredLines, totalLines);
    if (pct !== undefined) metrics.line = pct;
  }
  if (coveredBranches !== undefined && totalBranches !== undefined) {
    metrics.coveredBranches = coveredBranches;
    metrics.totalBranches = totalBranches;
    const pct = percentFromCounts(coveredBranches, totalBranches);
    if (pct !== undefined) metrics.branch = pct;
  }
  if (coveredMethods !== undefined && totalMethods !== undefined) {
    metrics.coveredMethods = coveredMethods;
    metrics.totalMethods = totalMethods;
    const pct = percentFromCounts(coveredMethods, totalMethods);
    if (pct !== undefined) metrics.method = pct;
  }
  if (coveredClasses !== undefined && totalClasses !== undefined) {
    metrics.coveredClasses = coveredClasses;
    metrics.totalClasses = totalClasses;
    const pct = percentFromCounts(coveredClasses, totalClasses);
    if (pct !== undefined) metrics.class = pct;
  }
  if (coveredFiles !== undefined && totalFiles !== undefined) {
    metrics.coveredFiles = coveredFiles;
    metrics.totalFiles = totalFiles;
    const pct = percentFromCounts(coveredFiles, totalFiles);
    if (pct !== undefined) metrics.file = pct;
  }
  return metrics;
}

export function parseRate(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value <= 1 ? Math.round(value * 1000) / 10 : Math.round(value * 10) / 10;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return undefined;
    return parsed <= 1 ? Math.round(parsed * 1000) / 10 : Math.round(parsed * 10) / 10;
  }
  return undefined;
}

export function asArray<T>(value: T | T[] | unknown | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? (value as T[]) : [value as T];
}

export function attrString(node: Record<string, unknown>, key: string): string | undefined {
  const prefixed = node[`@_${key}`];
  if (typeof prefixed === 'string') return prefixed;
  const plain = node[key];
  return typeof plain === 'string' ? plain : undefined;
}

export function attrNumber(node: Record<string, unknown>, key: string): number | undefined {
  const value = attrString(node, key);
  if (value === undefined) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}
