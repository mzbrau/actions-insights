import type { TestCase } from '../model/test-case';
import type { TestResultParser } from './types';
declare const PARSERS: TestResultParser[];
export declare function detectParser(filePath: string, content: string): TestResultParser | undefined;
export declare function parseTestFiles(pattern: string, cwd?: string): Promise<{
    tests: TestCase[];
    sourceFiles: string[];
}>;
export { PARSERS };
//# sourceMappingURL=registry.d.ts.map