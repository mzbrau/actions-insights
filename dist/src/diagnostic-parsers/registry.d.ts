import type { DiagnosticReport } from '../model/diagnostics';
import type { DiagnosticParser } from './types';
declare const PARSERS: DiagnosticParser[];
export declare function detectDiagnosticParser(filePath: string, content: string): DiagnosticParser | undefined;
export declare function parseDiagnosticFiles(pattern: string, cwd?: string): Promise<DiagnosticReport | undefined>;
export { PARSERS };
//# sourceMappingURL=registry.d.ts.map