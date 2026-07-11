import type { DiagnosticItem, DiagnosticReport } from '../model/diagnostics';
import { computeDiagnosticSummary } from '@actions-insights/history-models';

function diagnosticKey(item: DiagnosticItem): string {
  return [
    item.severity,
    item.file ?? '',
    item.line ?? '',
    item.column ?? '',
    item.code ?? '',
    item.message,
  ].join('|');
}

export function mergeDiagnosticReports(reports: DiagnosticReport[]): DiagnosticReport {
  const seen = new Set<string>();
  const items: DiagnosticItem[] = [];
  const sourceFiles: string[] = [];
  const matchedFiles: string[] = [];
  const errors: DiagnosticReport['errors'] = [];

  for (const report of reports) {
    sourceFiles.push(...report.sourceFiles);
    if (report.matchedFiles) matchedFiles.push(...report.matchedFiles);
    if (report.errors) errors.push(...report.errors);

    for (const item of report.items) {
      const key = diagnosticKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }

  return {
    summary: computeDiagnosticSummary(items),
    items,
    sourceFiles: [...new Set(sourceFiles)],
    matchedFiles: matchedFiles.length > 0 ? [...new Set(matchedFiles)] : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}
