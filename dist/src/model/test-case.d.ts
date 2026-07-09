export type TestOutcome = 'passed' | 'failed' | 'skipped' | 'inconclusive';
export interface TestAttachment {
    name: string;
    path?: string;
    contentType?: string;
    data?: string;
}
export interface TestCase {
    id: string;
    name: string;
    fullName: string;
    outcome: TestOutcome;
    durationMs: number;
    assembly?: string;
    namespace?: string;
    className?: string;
    method?: string;
    message?: string;
    stackTrace?: string;
    stdout?: string;
    stderr?: string;
    attachments: TestAttachment[];
    traits: string[];
    categories: string[];
    retries: number;
    sourceFile: string;
    isNewFailure?: boolean;
}
export declare function slugify(value: string): string;
export declare function testCaseId(fullName: string): string;
export declare const OUTCOME_PRIORITY: Record<TestOutcome, number>;
export declare function worseOutcome(a: TestOutcome, b: TestOutcome): TestOutcome;
export declare function mergeTestCases(existing: TestCase, incoming: TestCase): TestCase;
//# sourceMappingURL=test-case.d.ts.map