import type { TestCase, TestOutcome } from '../model/test-case';
import { testCaseId } from '../model/test-case';
import type { TestResultParser } from './types';
import { createXmlParser } from './xml-parser';

const parser = createXmlParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) =>
    name === 'test-case' ||
    name === 'test-suite' ||
    name === 'test' ||
    name === 'failure' ||
    name === 'reason',
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function mapNUnitOutcome(result: string | undefined): TestOutcome {
  const value = (result ?? '').toLowerCase();
  if (value === 'passed' || value === 'success') return 'passed';
  if (value === 'failed' || value === 'error') return 'failed';
  if (value === 'skipped' || value === 'ignored') return 'skipped';
  return 'inconclusive';
}

function parseDuration(seconds: string | number | undefined, ticks?: string): number {
  if (ticks) {
    const t = Number(ticks);
    if (Number.isFinite(t)) return Math.round(t / 10000);
  }
  if (seconds == null) return 0;
  const num = typeof seconds === 'number' ? seconds : Number.parseFloat(seconds);
  return Number.isFinite(num) ? Math.round(num * 1000) : 0;
}

function getText(node: unknown): string | undefined {
  if (node == null) return undefined;
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (typeof node === 'object' && node !== null) {
    if ('#text' in node) return String((node as { '#text': string })['#text']);
    if ('message' in node) return getText((node as { message: unknown }).message);
  }
  return undefined;
}

interface SuiteContext {
  assembly?: string;
  qualifiedPrefix?: string;
}

function isAssemblySuite(suite: Record<string, unknown>): boolean {
  const type = ((suite['@_type'] as string) ?? '').toLowerCase();
  return type === 'assembly';
}

function extendQualifiedPrefix(prefix: string | undefined, segment: string | undefined): string | undefined {
  if (!segment) return prefix;
  return prefix ? `${prefix}.${segment}` : segment;
}

function resolveSuiteQualifiedPrefix(
  suite: Record<string, unknown>,
  parentPrefix: string | undefined,
): string | undefined {
  const suiteFullName = suite['@_fullname'] as string | undefined;
  if (suiteFullName) return suiteFullName;

  const suiteType = ((suite['@_type'] as string) ?? '').toLowerCase();
  if (suiteType === 'assembly') return parentPrefix;

  const suiteName = suite['@_name'] as string | undefined;
  if (!suiteName) return parentPrefix;

  if (suiteType === 'testfixture' || suiteType === 'testsuite' || suiteType === 'testfixturesetup') {
    return extendQualifiedPrefix(parentPrefix, suiteName);
  }

  return parentPrefix;
}

function walkSuites(
  suite: Record<string, unknown>,
  filePath: string,
  context: SuiteContext = {},
): TestCase[] {
  const cases: TestCase[] = [];
  const assembly = isAssemblySuite(suite)
    ? ((suite['@_name'] as string) ?? context.assembly)
    : context.assembly;
  const qualifiedPrefix = resolveSuiteQualifiedPrefix(suite, context.qualifiedPrefix);
  const childContext: SuiteContext = { assembly, qualifiedPrefix };

  for (const tc of asArray(suite['test-case'] as unknown)) {
    if (!tc || typeof tc !== 'object') continue;
    const t = tc as Record<string, unknown>;
    const name = (t['@_name'] as string) ?? 'unknown';
    const fullName =
      (t['@_fullname'] as string) ??
      (qualifiedPrefix ? `${qualifiedPrefix}.${name}` : name);
    const methodNameAttr = t['@_methodname'] as string | undefined;
    const method = methodNameAttr ?? name;
    let qualifiedClass: string;
    if (methodNameAttr && name !== methodNameAttr) {
      if (qualifiedPrefix) {
        qualifiedClass = qualifiedPrefix;
      } else if (fullName.endsWith(`.${name}`)) {
        qualifiedClass = fullName.slice(0, -(name.length + 1));
      } else {
        qualifiedClass = fullName;
      }
    } else if (fullName.endsWith(`.${method}`)) {
      qualifiedClass = fullName.slice(0, -(method.length + 1));
    } else {
      qualifiedClass = fullName;
    }
    const namespace = qualifiedClass.includes('.')
      ? qualifiedClass.slice(0, qualifiedClass.lastIndexOf('.'))
      : undefined;
    const className = qualifiedClass.includes('.')
      ? qualifiedClass.slice(qualifiedClass.lastIndexOf('.') + 1)
      : qualifiedClass;
    const failure = asArray(t.failure as unknown)[0] as Record<string, unknown> | undefined;
    const reason = asArray(t.reason as unknown)[0] as Record<string, unknown> | undefined;
    const outcome = mapNUnitOutcome(t['@_result'] as string | undefined);

    cases.push({
      id: testCaseId(fullName),
      name,
      fullName,
      outcome,
      durationMs: parseDuration(t['@_duration'] as string | undefined, t['@_duration'] as string | undefined),
      assembly,
      namespace,
      className,
      method,
      message: failure ? getText(failure) ?? getText(failure['@_message']) : getText(reason),
      stackTrace: failure ? getText((failure as { 'stack-trace'?: unknown })['stack-trace']) : undefined,
      stdout: undefined,
      stderr: undefined,
      attachments: [],
      traits: asArray(t['traits'] as unknown).flatMap((tr) => {
        if (!tr || typeof tr !== 'object') return [];
        return asArray((tr as Record<string, unknown>).trait as unknown).map((x) =>
          typeof x === 'object' && x !== null ? String((x as Record<string, string>)['@_value'] ?? '') : '',
        );
      }).filter(Boolean),
      categories: [],
      retries: 0,
      sourceFile: filePath,
    });
  }

  for (const child of asArray(suite['test-suite'] as unknown)) {
    if (child && typeof child === 'object') {
      cases.push(...walkSuites(child as Record<string, unknown>, filePath, childContext));
    }
  }

  return cases;
}

export const nunitParser: TestResultParser = {
  format: 'nunit',
  canParse(_filePath, peek) {
    return (
      peek.includes('<test-run') ||
      peek.includes('test-run ') ||
      (peek.includes('nunit') && peek.includes('test-case'))
    );
  },
  parse(content, filePath) {
    const doc = parser.parse(content);
    const root = doc['test-run'];
    if (!root) return [];
    return walkSuites(root as Record<string, unknown>, filePath);
  },
};
