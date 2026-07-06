import { XMLParser } from 'fast-xml-parser';
import type { TestCase, TestOutcome } from '../model/test-case';
import { testCaseId } from '../model/test-case';
import type { TestResultParser } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => name === 'assembly' || name === 'collection' || name === 'test' || name === 'trait',
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function mapXUnitOutcome(result: string | undefined): TestOutcome {
  const value = (result ?? '').toLowerCase();
  if (value === 'pass') return 'passed';
  if (value === 'fail') return 'failed';
  if (value === 'skip') return 'skipped';
  return 'inconclusive';
}

function parseTicks(ticks: string | number | undefined): number {
  if (ticks == null) return 0;
  const t = typeof ticks === 'number' ? ticks : Number.parseFloat(ticks);
  if (!Number.isFinite(t)) return 0;
  return Math.round(t / 10000);
}

function getText(node: unknown): string | undefined {
  if (node == null) return undefined;
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (typeof node === 'object' && node !== null && '#text' in node) {
    return String((node as { '#text': string })['#text']);
  }
  return undefined;
}

function parseType(typeName: string | undefined): { namespace?: string; className?: string; method?: string } {
  if (!typeName) return {};
  const methodMatch = /^(.+)\.([^+.]+)(?:\+(.+))?$/.exec(typeName);
  if (!methodMatch) return { className: typeName };
  const qualified = methodMatch[1];
  const method = methodMatch[3] ?? methodMatch[2];
  const lastDot = qualified.lastIndexOf('.');
  if (lastDot === -1) return { className: qualified, method };
  return {
    namespace: qualified.slice(0, lastDot),
    className: qualified.slice(lastDot + 1),
    method,
  };
}

export const xunitParser: TestResultParser = {
  format: 'xunit',
  canParse(_filePath, peek) {
    return peek.includes('<assemblies') || peek.includes('xUnit.net') || peek.includes('<assembly ');
  },
  parse(content, filePath) {
    const doc = parser.parse(content);
    const assemblies = asArray(doc.assemblies?.assembly ?? doc.assembly);
    const cases: TestCase[] = [];

    for (const assembly of assemblies) {
      if (!assembly || typeof assembly !== 'object') continue;
      const assemblyName = (assembly as Record<string, string>)['@_name'] ?? filePath;
      const collections = asArray((assembly as Record<string, unknown>).collection as unknown);

      for (const collection of collections) {
        if (!collection || typeof collection !== 'object') continue;
        for (const test of asArray((collection as Record<string, unknown>).test as unknown)) {
          if (!test || typeof test !== 'object') continue;
          const t = test as Record<string, unknown>;
          const name = (t['@_name'] as string) ?? 'unknown';
          const typeName = t['@_type'] as string | undefined;
          const parsed = parseType(typeName);
          const fullName = typeName ? `${typeName}.${name}` : name;
          const failure = t.failure as Record<string, unknown> | undefined;
          const outcome = mapXUnitOutcome(t['@_result'] as string | undefined);

          cases.push({
            id: testCaseId(fullName),
            name,
            fullName,
            outcome,
            durationMs: parseTicks(t['@_time'] as string | undefined),
            assembly: assemblyName,
            namespace: parsed.namespace,
            className: parsed.className,
            method: parsed.method ?? name,
            message: failure ? getText(failure) ?? getText(failure['@_message']) : getText(t.reason),
            stackTrace: failure ? getText(failure['stack-trace']) : undefined,
            stdout: getText(t.output),
            stderr: undefined,
            attachments: [],
            traits: asArray(t.trait as unknown).map((tr) =>
              typeof tr === 'object' && tr !== null
                ? `${(tr as Record<string, string>)['@_name']}=${(tr as Record<string, string>)['@_value']}`
                : '',
            ).filter(Boolean),
            categories: [],
            retries: 0,
            sourceFile: filePath,
          });
        }
      }
    }

    return cases;
  },
};
