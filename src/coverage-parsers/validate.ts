import type { CoverageMetrics, CoverageReport } from '../model/coverage';

export interface CoverageValidationIssue {
  level: 'warning' | 'error';
  message: string;
}

function validateMetricRange(metrics: CoverageMetrics, context: string, issues: CoverageValidationIssue[]): void {
  const pctKeys: Array<keyof CoverageMetrics> = ['line', 'branch', 'method', 'class', 'file'];
  for (const key of pctKeys) {
    const value = metrics[key];
    if (typeof value === 'number' && (value < 0 || value > 100)) {
      issues.push({ level: 'error', message: `${context}: ${key} percentage ${value} is out of range 0–100` });
    }
  }

  const pairs: Array<[keyof CoverageMetrics, keyof CoverageMetrics]> = [
    ['coveredLines', 'totalLines'],
    ['coveredBranches', 'totalBranches'],
    ['coveredMethods', 'totalMethods'],
    ['coveredClasses', 'totalClasses'],
    ['coveredFiles', 'totalFiles'],
  ];
  for (const [coveredKey, totalKey] of pairs) {
    const covered = metrics[coveredKey];
    const total = metrics[totalKey];
    if (typeof covered === 'number' && typeof total === 'number' && covered > total) {
      issues.push({
        level: 'error',
        message: `${context}: ${String(coveredKey)} (${covered}) exceeds ${String(totalKey)} (${total})`,
      });
    }
  }
}

export function validateCoverageReport(report: CoverageReport): CoverageValidationIssue[] {
  const issues: CoverageValidationIssue[] = [];

  validateMetricRange(report.summary, 'summary', issues);

  for (const project of report.projects) {
    validateMetricRange(project.metrics, `project "${project.name}"`, issues);
    for (const pkg of project.packages ?? []) {
      validateMetricRange(pkg.metrics, `package "${pkg.name}"`, issues);
      for (const cls of pkg.classes ?? []) {
        validateMetricRange(cls.metrics, `class "${cls.name}"`, issues);
      }
    }
    for (const file of project.files ?? []) {
      validateMetricRange(file.metrics, `file "${file.path}"`, issues);
    }
  }

  if (report.projects.length === 0 && report.sourceFiles.length > 0) {
    issues.push({ level: 'warning', message: 'Coverage report parsed but contains no projects' });
  }

  return issues;
}

export function applyValidationWarnings(report: CoverageReport, issues: CoverageValidationIssue[]): CoverageReport {
  const warnings = issues.filter((i) => i.level === 'warning');
  if (warnings.length === 0) return report;
  const errors = report.errors ?? [];
  return {
    ...report,
    errors: [
      ...errors,
      ...warnings.map((w) => ({ file: 'validation', message: w.message })),
    ],
  };
}
