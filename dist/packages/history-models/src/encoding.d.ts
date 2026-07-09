import type { CompactFailureRecord, CompactTestRecord, FailureRecord, RepositoryTestsFile, RunRecord, StoredTestRecord, TestHistoryEntry } from './index';
export interface EncodeTestInput {
    fullName: string;
    outcomeCode: number;
    durationMs: number;
    namespace?: string;
    className?: string;
    method?: string;
    assembly?: string;
    stackTrace?: string;
    isNewFailure?: boolean;
}
export interface EncodeFailureInput {
    testIndex: number;
    message?: string;
    stackTrace?: string;
    stdout?: string;
    stderr?: string;
}
export interface NormalizedRunRecord extends Omit<RunRecord, 'tests' | 'failures' | 'classes'> {
    tests: CompactTestRecord[];
    failures: FailureRecord[];
}
export declare function normalizeMethodName(fullName: string, method?: string): string;
export declare function deriveQualifiedClassName(test: {
    fullName: string;
    namespace?: string;
    className?: string;
    method: string;
}): string | undefined;
export declare function resolveTestFullName(classes: string[] | undefined, test: StoredTestRecord): string;
export declare function encodeRunTests(inputs: EncodeTestInput[]): {
    classes?: string[];
    tests: StoredTestRecord[];
};
export declare function encodeRunFailures(inputs: EncodeFailureInput[]): CompactFailureRecord[];
export declare function expandRunTests(run: Pick<RunRecord, 'classes' | 'tests'>): CompactTestRecord[];
export declare function expandRunFailures(failures: CompactFailureRecord[], expandedTests: CompactTestRecord[]): FailureRecord[];
export declare function normalizeRunRecord(run: RunRecord): NormalizedRunRecord;
export declare function decodeRepositoryTestsFile(file: RepositoryTestsFile): Record<string, TestHistoryEntry>;
export declare function encodeRepositoryTestsFile(tests: Record<string, TestHistoryEntry>, existingFile?: RepositoryTestsFile, updatedAt?: string): RepositoryTestsFile;
export declare function normalizeTestsFile(file: RepositoryTestsFile): Record<string, TestHistoryEntry>;
//# sourceMappingURL=encoding.d.ts.map