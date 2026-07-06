import type { TestCase } from '../model/test-case';
export interface StackLocation {
    path: string;
    line: number;
    column?: number;
}
export interface CheckAnnotation {
    path: string;
    start_line: number;
    end_line: number;
    annotation_level: 'failure' | 'warning';
    title: string;
    message: string;
}
export declare function parseStackLocation(stackTrace: string | undefined): StackLocation | undefined;
export declare function buildCheckAnnotations(failedTests: TestCase[], maxAnnotations: number, maxMessageLines: number): CheckAnnotation[];
//# sourceMappingURL=checks.d.ts.map