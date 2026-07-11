import { HISTORY_SCHEMA_VERSION } from './index';

export type DiagnosticSeverity = 'error' | 'warning' | 'note';

export const SEVERITY_TO_CODE: Record<DiagnosticSeverity, number> = {
  error: 0,
  warning: 1,
  note: 2,
};

export const CODE_TO_SEVERITY: DiagnosticSeverity[] = ['error', 'warning', 'note'];

export interface DiagnosticItem {
  severity: DiagnosticSeverity;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  source?: string;
}

export interface DiagnosticParseError {
  file: string;
  message: string;
}

export interface DiagnosticReport {
  summary: DiagnosticSummaryCompact;
  items: DiagnosticItem[];
  sourceFiles: string[];
  matchedFiles?: string[];
  errors?: DiagnosticParseError[];
}

export interface DiagnosticSummaryCompact {
  errors: number;
  warnings: number;
  notes?: number;
  bySource?: Record<string, { errors: number; warnings: number }>;
}

/** On-disk compact diagnostic item (schema v2). */
export interface CompactDiagnosticItem {
  s: number;
  m: string;
  p?: number;
  l?: number;
  c?: number;
  r?: string;
  o?: string;
}

/** Expanded diagnostic item used by the web UI after normalization. */
export interface NormalizedDiagnosticItem {
  severity: DiagnosticSeverity;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  source?: string;
}

export interface DiagnosticRunRecord {
  version: typeof HISTORY_SCHEMA_VERSION;
  runId: string;
  summary: DiagnosticSummaryCompact;
  items: CompactDiagnosticItem[];
  paths?: string[];
  sourceFiles: string[];
  truncated?: number;
}

export const MAX_DIAGNOSTICS_PER_RUN = 500;

export function computeDiagnosticSummary(items: DiagnosticItem[]): DiagnosticSummaryCompact {
  let errors = 0;
  let warnings = 0;
  let notes = 0;
  const bySource: Record<string, { errors: number; warnings: number }> = {};

  for (const item of items) {
    const source = item.source ?? 'unknown';
    if (!bySource[source]) bySource[source] = { errors: 0, warnings: 0 };

    switch (item.severity) {
      case 'error':
        errors++;
        bySource[source].errors++;
        break;
      case 'warning':
        warnings++;
        bySource[source].warnings++;
        break;
      case 'note':
        notes++;
        break;
    }
  }

  return {
    errors,
    warnings,
    ...(notes > 0 ? { notes } : {}),
    ...(Object.keys(bySource).length > 0 ? { bySource } : {}),
  };
}

function sortBySeverity(items: DiagnosticItem[]): DiagnosticItem[] {
  const order: Record<DiagnosticSeverity, number> = { error: 0, warning: 1, note: 2 };
  return [...items].sort((a, b) => order[a.severity] - order[b.severity]);
}

export function encodeDiagnosticRunRecord(
  runId: string,
  report: DiagnosticReport,
): DiagnosticRunRecord {
  const paths: string[] = [];
  const pathIndex = new Map<string, number>();

  const indexPath = (filePath: string): number => {
    const existing = pathIndex.get(filePath);
    if (existing !== undefined) return existing;
    const idx = paths.length;
    paths.push(filePath);
    pathIndex.set(filePath, idx);
    return idx;
  };

  const sorted = sortBySeverity(report.items);
  const truncated = sorted.length > MAX_DIAGNOSTICS_PER_RUN ? sorted.length - MAX_DIAGNOSTICS_PER_RUN : 0;
  const kept = sorted.slice(0, MAX_DIAGNOSTICS_PER_RUN);

  const items: CompactDiagnosticItem[] = kept.map((item) => {
    const compact: CompactDiagnosticItem = {
      s: SEVERITY_TO_CODE[item.severity],
      m: item.message,
    };
    if (item.file) compact.p = indexPath(item.file);
    if (item.line !== undefined) compact.l = item.line;
    if (item.column !== undefined) compact.c = item.column;
    if (item.code) compact.r = item.code;
    if (item.source) compact.o = item.source;
    return compact;
  });

  return {
    version: HISTORY_SCHEMA_VERSION,
    runId,
    summary: report.summary,
    items,
    sourceFiles: report.sourceFiles,
    ...(paths.length > 0 ? { paths } : {}),
    ...(truncated > 0 ? { truncated } : {}),
  };
}

export function normalizeDiagnosticRunRecord(raw: unknown): DiagnosticRunRecord {
  const record = raw as DiagnosticRunRecord;
  return {
    version: HISTORY_SCHEMA_VERSION,
    runId: record.runId,
    summary: record.summary ?? { errors: 0, warnings: 0 },
    items: record.items ?? [],
    paths: record.paths,
    sourceFiles: record.sourceFiles ?? [],
    truncated: record.truncated,
  };
}

export function expandDiagnosticItems(record: DiagnosticRunRecord): NormalizedDiagnosticItem[] {
  return record.items.map((item) => ({
    severity: CODE_TO_SEVERITY[item.s] ?? 'warning',
    message: item.m,
    file: item.p !== undefined ? record.paths?.[item.p] : undefined,
    line: item.l,
    column: item.c,
    code: item.r,
    source: item.o,
  }));
}
