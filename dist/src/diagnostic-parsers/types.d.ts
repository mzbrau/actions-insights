import type { DiagnosticReport } from '../model/diagnostics';
export type DiagnosticParserFormat = 'sarif' | 'msbuild' | 'gcc';
export interface DiagnosticParser {
    readonly format: DiagnosticParserFormat;
    canParse(filePath: string, peek: string): boolean;
    parse(content: string, filePath: string): DiagnosticReport;
}
//# sourceMappingURL=types.d.ts.map