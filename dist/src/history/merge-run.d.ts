import type { TestCase } from '../model/test-case';
import type { TestRun } from '../model/test-run';
export declare function readPartialRun(partialPath: string): TestCase[] | undefined;
import type { CoverageReport } from '../model/coverage';
export declare function writePartialRun(partialPath: string, tests: TestCase[], sourceFiles?: string[], matchedFiles?: string[], coverage?: CoverageReport): void;
export declare function mergePartialRun(run: TestRun, partialPath: string): TestRun;
//# sourceMappingURL=merge-run.d.ts.map