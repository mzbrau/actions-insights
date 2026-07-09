import type { TestCase } from '../model/test-case';
export interface FailureFormatOptions {
    maxStackTraceLines: number;
    includeStdout: boolean;
    includeStderr: boolean;
    compact?: boolean;
}
export declare function selectFailedTests(tests: TestCase[], limit: number): TestCase[];
export declare function countFailedTests(tests: TestCase[]): number;
export declare function formatFailureBlock(test: TestCase, options: FailureFormatOptions, displayName?: string): string;
export declare function formatGroupedFailures(failedTests: TestCase[], maxCount: number, options: FailureFormatOptions, formatName: (test: TestCase) => string, groupByClass: (tests: TestCase[]) => Array<{
    qualifiedClassName: string;
    tests: TestCase[];
}>): string[];
export declare function formatFailureTableRow(test: TestCase, options: FailureFormatOptions): string;
//# sourceMappingURL=failures.d.ts.map