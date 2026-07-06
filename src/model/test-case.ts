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

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'test';
}

export function testCaseId(fullName: string): string {
  return slugify(fullName);
}

export const OUTCOME_PRIORITY: Record<TestOutcome, number> = {
  failed: 4,
  inconclusive: 3,
  skipped: 2,
  passed: 1,
};

export function worseOutcome(a: TestOutcome, b: TestOutcome): TestOutcome {
  return OUTCOME_PRIORITY[a] >= OUTCOME_PRIORITY[b] ? a : b;
}

export function mergeTestCases(existing: TestCase, incoming: TestCase): TestCase {
  const outcome = worseOutcome(existing.outcome, incoming.outcome);
  const useIncoming = OUTCOME_PRIORITY[incoming.outcome] >= OUTCOME_PRIORITY[existing.outcome];
  return {
    ...existing,
    outcome,
    durationMs: Math.max(existing.durationMs, incoming.durationMs),
    message: useIncoming ? incoming.message ?? existing.message : existing.message,
    stackTrace: useIncoming ? incoming.stackTrace ?? existing.stackTrace : existing.stackTrace,
    stdout: useIncoming ? incoming.stdout ?? existing.stdout : existing.stdout,
    stderr: useIncoming ? incoming.stderr ?? existing.stderr : existing.stderr,
    attachments: useIncoming ? incoming.attachments : existing.attachments,
    retries: existing.retries + incoming.retries,
    traits: [...new Set([...existing.traits, ...incoming.traits])],
    categories: [...new Set([...existing.categories, ...incoming.categories])],
  };
}
