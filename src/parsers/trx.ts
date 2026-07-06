import { XMLParser } from 'fast-xml-parser';
import type { TestCase, TestOutcome } from '../model/test-case';
import { testCaseId } from '../model/test-case';
import type { TestResultParser } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) =>
    ['UnitTestResult', 'TestEntry', 'TestDefinitions', 'Entry', 'Result'].includes(name) ||
    name === 'TestCase' ||
    name === 'Test' ||
    name === 'testcase' ||
    name === 'testsuite',
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function mapTrxOutcome(outcome: string | undefined): TestOutcome {
  const value = (outcome ?? '').toLowerCase();
  if (value === 'passed') return 'passed';
  if (value === 'failed') return 'failed';
  if (value === 'notexecuted' || value === 'skipped') return 'skipped';
  return 'inconclusive';
}

function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = /^(\d+):(\d+):(\d+(?:\.\d+)?)$/.exec(duration);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

function getText(node: unknown): string | undefined {
  if (node == null) return undefined;
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (typeof node === 'object' && node !== null && '#text' in node) {
    return String((node as { '#text': string })['#text']);
  }
  return undefined;
}

export const trxParser: TestResultParser = {
  format: 'trx',
  canParse(filePath, peek) {
    return filePath.toLowerCase().endsWith('.trx') || peek.includes('<TestRun') || peek.includes('TestRun xmlns');
  },
  parse(content, filePath) {
    const doc = parser.parse(content);
    const testRun = doc.TestRun ?? doc['test-run'];
    if (!testRun) return [];

    const definitions = new Map<string, { className?: string; name?: string; storage?: string }>();
    for (const def of asArray(testRun.TestDefinitions?.UnitTest)) {
      const id = def['@_id'];
      if (!id) continue;
      definitions.set(id, {
        className: def.TestMethod?.['@_className'],
        name: def.TestMethod?.['@_name'],
        storage: def['@_storage'],
      });
    }

    const results = asArray(testRun.Results?.UnitTestResult);
    return results.map((result) => {
      const testId = result['@_testId'];
      const def = testId ? definitions.get(testId) : undefined;
      const className = def?.className ?? '';
      const method = def?.name ?? result['@_testName'] ?? 'unknown';
      const assembly = def?.storage ?? '';
      const namespace = className.includes('.') ? className.slice(0, className.lastIndexOf('.')) : '';
      const shortClass = className.includes('.') ? className.slice(className.lastIndexOf('.') + 1) : className;
      const fullName = className ? `${className}.${method}` : method;
      const outcome = mapTrxOutcome(result['@_outcome']);
      const output = result.Output ?? {};
      const errorInfo = result.Output?.ErrorInfo ?? result.Failure ?? {};

      return {
        id: testCaseId(fullName),
        name: method,
        fullName,
        outcome,
        durationMs: parseDuration(result['@_duration']),
        assembly,
        namespace,
        className: shortClass || className,
        method,
        message: getText(errorInfo.Message) ?? getText(result.Failure?.Message),
        stackTrace: getText(errorInfo.StackTrace) ?? getText(result.Failure?.StackTrace),
        stdout: getText(output.StdOut),
        stderr: getText(output.StdErr),
        attachments: [],
        traits: [],
        categories: [],
        retries: 0,
        sourceFile: filePath,
      } satisfies TestCase;
    });
  },
};
