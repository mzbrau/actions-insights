import type { TestCase } from '../model/test-case';
export interface TestClassGroup {
    qualifiedClassName: string;
    tests: TestCase[];
}
export declare function stripTestParameters(name: string): string;
export declare function getShortTestName(test: TestCase): string;
/** Method name suitable for GitHub code search (no namespace or parameters). */
export declare function getCodeSearchName(test: TestCase): string;
export declare function getQualifiedClassName(test: TestCase): string;
export declare function groupTestsByClass(tests: TestCase[]): TestClassGroup[];
export declare function groupTestsByClassWithFailuresFirst(tests: TestCase[]): TestClassGroup[];
export declare function formatGroupedTestLines(groups: TestClassGroup[], formatLine: (test: TestCase) => string): string[];
//# sourceMappingURL=grouping.d.ts.map