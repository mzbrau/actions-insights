import type { TestCase } from '../model/test-case';
export declare const SLOW_VISIBLE = 3;
export declare const SLOW_COLLAPSED = 15;
export declare const SLOW_TOTAL: number;
export declare function selectSlowestTests(tests: TestCase[], limit: number): TestCase[];
export declare function formatSlowTestLine(test: TestCase, slowThresholdMs: number, displayName?: string): string;
export declare function formatSlowTestTableRow(test: TestCase, slowThresholdMs: number): string;
export declare function formatSkippedTestLine(test: TestCase): string;
export declare function formatSlowTestsSection(slowTests: TestCase[], slowThresholdMs: number, options: {
    splitCollapsed?: boolean;
    formatName?: (test: TestCase) => string;
}): string[];
export declare function outcomeEmoji(outcome: TestCase['outcome']): string;
export declare function formatAllTestLine(test: TestCase, displayName: string): string;
export declare function classOutcomeCounts(tests: TestCase[]): string;
//# sourceMappingURL=slow-tests.d.ts.map