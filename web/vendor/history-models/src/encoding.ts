import type {
  CompactFailureRecord,
  CompactTestRecord,
  FailureRecord,
  RepositoryTestsFile,
  RunRecord,
  StoredTestRecord,
  TestHistoryEntry,
} from './index';

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

export function normalizeMethodName(fullName: string, method?: string): string {
  if (!method) {
    const lastDot = fullName.lastIndexOf('.');
    return lastDot >= 0 ? fullName.slice(lastDot + 1) : fullName;
  }
  if (method === fullName) {
    const lastDot = fullName.lastIndexOf('.');
    return lastDot >= 0 ? fullName.slice(lastDot + 1) : fullName;
  }
  if (fullName.endsWith(`.${method}`)) {
    return method;
  }
  if (method.includes('.')) {
    const lastDot = method.lastIndexOf('.');
    const shortMethod = method.slice(lastDot + 1);
    if (fullName.endsWith(`.${shortMethod}`)) {
      return shortMethod;
    }
  }
  return method;
}

export function deriveQualifiedClassName(test: {
  fullName: string;
  namespace?: string;
  className?: string;
  method: string;
}): string | undefined {
  const suffix = `.${test.method}`;
  if (test.fullName.endsWith(suffix)) {
    const prefix = test.fullName.slice(0, -suffix.length);
    return prefix || undefined;
  }
  if (test.namespace && test.className) {
    return `${test.namespace}.${test.className}`;
  }
  if (test.className?.includes('.')) {
    return test.className;
  }
  if (test.className) {
    return test.namespace ? `${test.namespace}.${test.className}` : test.className;
  }
  return undefined;
}

export function resolveTestFullName(
  classes: string[] | undefined,
  test: StoredTestRecord,
): string {
  if (test.n) return test.n;
  const cls = test.c !== undefined ? classes?.[test.c] : undefined;
  if (cls && test.m) return `${cls}.${test.m}`;
  return test.m ?? '';
}

function splitQualifiedClassName(qualifiedClass: string): { ns?: string; c: string } {
  const lastDot = qualifiedClass.lastIndexOf('.');
  if (lastDot <= 0) return { c: qualifiedClass };
  return {
    ns: qualifiedClass.slice(0, lastDot),
    c: qualifiedClass.slice(lastDot + 1),
  };
}

export function deriveClassNameFromCompactRecord(test: CompactTestRecord): string {
  const method = test.m ?? test.n;
  if (method && test.n.endsWith(`.${method}`)) {
    return test.n.slice(0, -(method.length + 1));
  }

  if (test.ns && test.c && !test.c.includes('(')) {
    return `${test.ns}.${test.c}`;
  }

  if (test.c && !test.c.includes('(')) {
    return test.c;
  }

  const lastDot = test.n.lastIndexOf('.');
  return lastDot > 0 ? test.n.slice(0, lastDot) : test.n;
}

export function encodeRunTests(inputs: EncodeTestInput[]): {
  classes?: string[];
  tests: StoredTestRecord[];
} {
  const classToIndex = new Map<string, number>();
  const classes: string[] = [];
  const tests: StoredTestRecord[] = [];

  for (const input of inputs) {
    const method = normalizeMethodName(input.fullName, input.method);
    const qualifiedClass = deriveQualifiedClassName({
      fullName: input.fullName,
      namespace: input.namespace,
      className: input.className,
      method,
    });

    const stored: StoredTestRecord = {
      o: input.outcomeCode,
      d: input.durationMs,
      ...(input.assembly ? { a: input.assembly } : {}),
      ...(input.stackTrace ? { st: input.stackTrace } : {}),
      ...(input.isNewFailure ? { nf: true } : {}),
    };

    if (
      qualifiedClass &&
      (input.fullName === `${qualifiedClass}.${method}` ||
        Boolean(input.namespace && input.className && input.method))
    ) {
      let classIndex = classToIndex.get(qualifiedClass);
      if (classIndex === undefined) {
        classIndex = classes.length;
        classes.push(qualifiedClass);
        classToIndex.set(qualifiedClass, classIndex);
      }
      tests.push({ ...stored, c: classIndex, m: method });
    } else {
      tests.push({ ...stored, n: input.fullName });
    }
  }

  return classes.length > 0 ? { classes, tests } : { tests };
}

export function encodeRunFailures(inputs: EncodeFailureInput[]): CompactFailureRecord[] {
  return inputs.map((input) => ({
    t: input.testIndex,
    ...(input.message ? { message: input.message } : {}),
    ...(input.stackTrace ? { stackTrace: input.stackTrace } : {}),
    ...(input.stdout ? { stdout: input.stdout } : {}),
    ...(input.stderr ? { stderr: input.stderr } : {}),
  }));
}

export function expandRunTests(run: Pick<RunRecord, 'classes' | 'tests'>): CompactTestRecord[] {
  return run.tests.map((test, index) => {
    const fullName = resolveTestFullName(run.classes, test);
    const record: CompactTestRecord = {
      i: index,
      n: fullName,
      o: test.o,
      d: test.d,
      ...(test.a ? { a: test.a } : {}),
      ...(test.st ? { st: test.st } : {}),
      ...(test.nf ? { nf: true } : {}),
    };

    if (test.m) {
      record.m = test.m;
      if (test.c !== undefined) {
        const qualifiedClass = run.classes?.[test.c];
        if (qualifiedClass) {
          const { ns, c } = splitQualifiedClassName(qualifiedClass);
          record.c = c;
          if (ns) record.ns = ns;
        }
      }
    }

    return record;
  });
}

export function expandRunFailures(
  failures: CompactFailureRecord[],
  expandedTests: CompactTestRecord[],
): FailureRecord[] {
  return failures.map((failure) => {
    const test = expandedTests[failure.t];
    const fullName = test?.n ?? `test-${failure.t}`;
    const lastDot = fullName.lastIndexOf('.');
    const testName = lastDot >= 0 ? fullName.slice(lastDot + 1) : fullName;
    return {
      testName,
      fullName,
      message: failure.message,
      stackTrace: failure.stackTrace,
      stdout: failure.stdout,
      stderr: failure.stderr,
    };
  });
}

export function normalizeRunRecord(run: RunRecord): NormalizedRunRecord {
  const tests = expandRunTests(run);
  const failures = expandRunFailures(run.failures, tests);
  const { classes: _classes, ...rest } = run;
  return { ...rest, tests, failures };
}

export function decodeRepositoryTestsFile(
  file: RepositoryTestsFile,
): Record<string, TestHistoryEntry> {
  const result: Record<string, TestHistoryEntry> = {};
  for (const [id, entry] of Object.entries(file.entries)) {
    const name = file.names[Number(id)];
    if (name) {
      result[name] = entry;
    }
  }
  return result;
}

export function encodeRepositoryTestsFile(
  tests: Record<string, TestHistoryEntry>,
  existingFile?: RepositoryTestsFile,
  updatedAt?: string,
): RepositoryTestsFile {
  const names = existingFile ? [...existingFile.names] : [];
  const nameToId = new Map<string, number>();
  names.forEach((name, index) => nameToId.set(name, index));

  const entries: Record<string, TestHistoryEntry> = {};
  for (const [fullName, entry] of Object.entries(tests)) {
    let id = nameToId.get(fullName);
    if (id === undefined) {
      id = names.length;
      names.push(fullName);
      nameToId.set(fullName, id);
    }
    entries[String(id)] = entry;
  }

  return {
    version: 2,
    updatedAt: updatedAt ?? new Date().toISOString(),
    names,
    entries,
  };
}

export function normalizeTestsFile(
  file: RepositoryTestsFile,
): Record<string, TestHistoryEntry> {
  return decodeRepositoryTestsFile(file);
}
