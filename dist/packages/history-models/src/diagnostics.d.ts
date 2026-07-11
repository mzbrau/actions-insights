import { HISTORY_SCHEMA_VERSION } from './index';
export type DiagnosticSeverity = 'error' | 'warning' | 'note';
export declare const SEVERITY_TO_CODE: Record<DiagnosticSeverity, number>;
export declare const CODE_TO_SEVERITY: DiagnosticSeverity[];
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
    bySource?: Record<string, {
        errors: number;
        warnings: number;
    }>;
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
export declare const MAX_DIAGNOSTICS_PER_RUN = 500;
export declare function computeDiagnosticSummary(items: DiagnosticItem[]): DiagnosticSummaryCompact;
export declare function encodeDiagnosticRunRecord(runId: string, report: DiagnosticReport): DiagnosticRunRecord;
export declare function normalizeDiagnosticRunRecord(raw: unknown): DiagnosticRunRecord;
export declare function expandDiagnosticItems(record: DiagnosticRunRecord): NormalizedDiagnosticItem[];
//# sourceMappingURL=diagnostics.d.ts.map