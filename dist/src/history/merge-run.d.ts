import type { TestCase } from '../model/test-case';
import type { TestRun } from '../model/test-run';
export declare function readPartialRun(partialPath: string): TestCase[] | undefined;
export declare function writePartialRun(partialPath: string, tests: TestCase[], sourceFiles?: string[], matchedFiles?: string[]): void;
export declare function mergePartialRun(run: TestRun, partialPath: string): TestRun;
//# sourceMappingURL=merge-run.d.ts.map