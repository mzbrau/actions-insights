import type { TestCase } from '../model/test-case';
import type { ReportLinks } from './links';
export interface SourceFileGroup {
    sourceFile: string;
    label: string;
    tests: TestCase[];
}
interface OutcomeCounts {
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
}
export declare function formatReportLabel(path: string): string;
export declare function runAnchorId(runIndex: number): string;
export declare function classAnchorId(runIndex: number, classIndex: number): string;
export declare function groupTestsBySourceFile(tests: TestCase[], sourceFileOrder?: string[]): SourceFileGroup[];
export declare function countOutcomes(tests: TestCase[]): OutcomeCounts;
export declare function formatCountCell(count: number, emoji: string): string;
export declare function formatJobSummaryTestTables(tests: TestCase[], sourceFiles: string[] | undefined, _links: ReportLinks, formatName?: (test: TestCase) => string): string[];
/** @deprecated Use formatJobSummaryTestTables */
export declare function formatAllTestsSection(tests: TestCase[], links: ReportLinks, formatName?: (test: TestCase) => string): string[];
export {};
//# sourceMappingURL=all-tests-summary.d.ts.map