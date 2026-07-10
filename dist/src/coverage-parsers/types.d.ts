import type { CoverageReport } from '../model/coverage';
export type CoverageParserFormat = 'cobertura' | 'opencover' | 'lcov' | 'jacoco';
export interface CoverageParser {
    readonly format: CoverageParserFormat;
    canParse(filePath: string, peek: string): boolean;
    parse(content: string, filePath: string): CoverageReport;
}
//# sourceMappingURL=types.d.ts.map