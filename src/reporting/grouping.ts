import type { TestCase } from '../model/test-case';

export interface TestClassGroup {
  qualifiedClassName: string;
  tests: TestCase[];
}

export function stripTestParameters(name: string): string {
  const paren = name.indexOf('(');
  return (paren >= 0 ? name.slice(0, paren) : name).trim();
}

export function getShortTestName(test: TestCase): string {
  const candidate = test.method ?? test.name;
  if (candidate && !candidate.includes('.')) {
    return candidate;
  }

  const full = test.fullName ?? candidate ?? '';
  const lastDot = full.lastIndexOf('.');
  return lastDot >= 0 ? full.slice(lastDot + 1) : full;
}

/** Method name suitable for GitHub code search (no namespace or parameters). */
export function getCodeSearchName(test: TestCase): string {
  return stripTestParameters(getShortTestName(test));
}

export function getQualifiedClassName(test: TestCase): string {
  const method = test.method ?? test.name;
  if (method && test.fullName.endsWith(`.${method}`)) {
    return test.fullName.slice(0, -(method.length + 1));
  }

  if (test.namespace && test.className && !test.className.includes('(')) {
    return `${test.namespace}.${test.className}`;
  }

  if (test.className && !test.className.includes('(')) {
    return test.className;
  }

  const lastDot = test.fullName.lastIndexOf('.');
  return lastDot > 0 ? test.fullName.slice(0, lastDot) : test.fullName;
}

export function groupTestsByClass(tests: TestCase[]): TestClassGroup[] {
  const groups = new Map<string, TestCase[]>();

  for (const test of tests) {
    const key = getQualifiedClassName(test);
    const existing = groups.get(key);
    if (existing) {
      existing.push(test);
    } else {
      groups.set(key, [test]);
    }
  }

  const result: TestClassGroup[] = [];
  for (const [qualifiedClassName, groupTests] of groups) {
    groupTests.sort((a, b) => getShortTestName(a).localeCompare(getShortTestName(b)));
    result.push({ qualifiedClassName, tests: groupTests });
  }

  result.sort((a, b) => a.qualifiedClassName.localeCompare(b.qualifiedClassName));
  return result;
}

export function groupTestsByClassWithFailuresFirst(tests: TestCase[]): TestClassGroup[] {
  const groups = groupTestsByClass(tests);
  return groups.sort((a, b) => {
    const aFailed = a.tests.some((t) => t.outcome === 'failed');
    const bFailed = b.tests.some((t) => t.outcome === 'failed');
    if (aFailed && !bFailed) return -1;
    if (!aFailed && bFailed) return 1;
    return a.qualifiedClassName.localeCompare(b.qualifiedClassName);
  });
}

export function formatGroupedTestLines(
  groups: TestClassGroup[],
  formatLine: (test: TestCase) => string,
): string[] {
  const lines: string[] = [];
  for (const group of groups) {
    lines.push(`### ${group.qualifiedClassName}`);
    for (const test of group.tests) {
      lines.push(formatLine(test));
    }
    lines.push('');
  }
  return lines;
}
