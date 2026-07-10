import type { CoverageReport } from '../model/coverage';
import type { CoverageParser } from './types';
declare const PARSERS: CoverageParser[];
export declare function detectCoverageParser(filePath: string, content: string): CoverageParser | undefined;
export declare function parseCoverageFiles(pattern: string, cwd?: string): Promise<CoverageReport | undefined>;
export { PARSERS };
//# sourceMappingURL=registry.d.ts.map