import type { TestCase } from '../model/test-case';
export declare function selectSlowestTests(tests: TestCase[], limit: number): TestCase[];
export declare function formatSlowTestLine(test: TestCase, slowThresholdMs: number): string;
export declare function formatSlowTestTableRow(test: TestCase, slowThresholdMs: number): string;
export declare function formatSkippedTestLine(test: TestCase): string;
//# sourceMappingURL=slow-tests.d.ts.map