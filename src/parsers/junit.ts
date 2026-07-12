import type { TestCase, TestOutcome } from '../model/test-case';
import { testCaseId } from '../model/test-case';
import type { TestResultParser } from './types';
import { createXmlParser } from './xml-parser';
import { asArray, looksQualifiedTypeName } from './xml-utils';

const parser = createXmlParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) =>
    name === 'testcase' ||
    name === 'testsuite' ||
    name === 'failure' ||
    name === 'error' ||
    name === 'skipped',
});

function mapOutcome(status: string | undefined): TestOutcome {
  const value = (status ?? '').toLowerCase();
  if (value === 'passed' || value === 'pass') return 'passed';
  if (value === 'failed' || value === 'fail' || value === 'error') return 'failed';
  if (value === 'skipped' || value === 'skip' || value === 'ignored') return 'skipped';
  return 'inconclusive';
}

function parseSeconds(value: string | number | undefined): number {
  if (value == null) return 0;
  const num = typeof value === 'number' ? value : Number.parseFloat(value);
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

function hasChildElement(value: unknown): boolean {
  return value != null && (Array.isArray(value) ? value.length > 0 : true);
}

function getResultElement(
  elements: Record<string, unknown> | undefined,
): { message?: string; stackTrace?: string } | undefined {
  if (!elements) return undefined;
  const attributeMessage = getText(elements['@_message']);
  const bodyText = getText(elements);
  const explicitStack = getText((elements as { stacktrace?: unknown }).stacktrace);
  return {
    message: attributeMessage ?? bodyText,
    stackTrace:
      attributeMessage && bodyText && bodyText !== attributeMessage ? bodyText : explicitStack,
  };
}

function parseClassName(classname: string | undefined): { namespace?: string; className?: string } {
  if (!classname) return {};
  const lastDot = classname.lastIndexOf('.');
  if (lastDot === -1) return { className: classname };
  return {
    namespace: classname.slice(0, lastDot),
    className: classname.slice(lastDot + 1),
  };
}

function collectTestCases(
  suites: unknown[],
  filePath: string,
  parentAssembly?: string,
  suiteClassName?: string,
): TestCase[] {
  const cases: TestCase[] = [];

  for (const suite of suites) {
    if (!suite || typeof suite !== 'object') continue;
    const s = suite as Record<string, unknown>;
    const suiteName = s['@_name'] as string | undefined;
    const currentSuiteClass = looksQualifiedTypeName(suiteName) ? suiteName : suiteClassName;
    const assembly = (s['@_package'] as string) ?? suiteName ?? parentAssembly;

    for (const tc of asArray(s.testcase as unknown)) {
      if (!tc || typeof tc !== 'object') continue;
      const t = tc as Record<string, unknown>;
      const name = (t['@_name'] as string) ?? 'unknown';
      const classname = (t['@_classname'] as string | undefined) ?? currentSuiteClass;
      const { namespace, className } = parseClassName(classname);
      const fullName = classname ? `${classname}.${name}` : name;
      const failure = asArray(t.failure as unknown)[0] as Record<string, unknown> | undefined;
      const error = asArray(t.error as unknown)[0] as Record<string, unknown> | undefined;
      const skipped = asArray(t.skipped as unknown)[0] as Record<string, unknown> | undefined;
      const hasSkipped = 'skipped' in t;
      let outcome: TestOutcome = mapOutcome(t['@_status'] as string | undefined);
      if (!t['@_status']) {
        if (hasChildElement(t.failure)) outcome = 'failed';
        else if (hasChildElement(t.error)) outcome = 'failed';
        else if (hasSkipped) outcome = 'skipped';
        else outcome = 'passed';
      }

      const failureResult = getResultElement(failure);
      const errorResult = getResultElement(error);
      const result = failureResult ?? errorResult;
      let message = result?.message;
      if (!message && hasSkipped) {
        message = getText(skipped?.['@_message']) ?? getText(t['system-out']);
      }

      cases.push({
        id: testCaseId(fullName),
        name,
        fullName,
        outcome,
        durationMs: parseSeconds(t['@_time'] as string | number | undefined),
        assembly,
        namespace,
        className,
        method: name,
        message,
        stackTrace: result?.stackTrace,
        stdout: getText(t['system-out']),
        stderr: getText(t['system-err']),
        attachments: [],
        traits: [],
        categories: [],
        retries: 0,
        sourceFile: filePath,
      });
    }

    cases.push(...collectTestCases(asArray(s.testsuite as unknown), filePath, assembly, currentSuiteClass));
  }

  return cases;
}

export const junitParser: TestResultParser = {
  format: 'junit',
  canParse(filePath, peek) {
    if (filePath.toLowerCase().endsWith('.trx')) return false;
    return (
      peek.includes('<testsuite') ||
      peek.includes('<testsuites') ||
      (peek.includes('testcase') && !peek.includes('test-run') && !peek.includes('TestRun'))
    );
  },
  parse(content, filePath) {
    const doc = parser.parse(content);
    const root = doc.testsuites ?? doc.testsuite;
    if (!root) return [];
    const suites = asArray(root);
    if (root.testcase || root.testsuite) {
      return collectTestCases([root], filePath);
    }
    return collectTestCases(suites, filePath);
  },
};
