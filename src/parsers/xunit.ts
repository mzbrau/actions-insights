import type { TestCase, TestOutcome } from '../model/test-case';
import { testCaseId } from '../model/test-case';
import type { TestResultParser } from './types';
import { createXmlParser } from './xml-parser';
import { asArray, looksQualifiedTypeName } from './xml-utils';

const parser = createXmlParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => name === 'assembly' || name === 'collection' || name === 'test' || name === 'trait',
});

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

function resolveTypeName(
  test: Record<string, unknown>,
  collection: Record<string, unknown>,
): string | undefined {
  const typeName = test['@_type'] as string | undefined;
  if (typeName) return typeName;

  const name = (test['@_name'] as string) ?? '';
  const method = test['@_method'] as string | undefined;
  if (method?.includes('.')) {
    if (name && method.endsWith(`.${name}`)) {
      return method.slice(0, -(name.length + 1));
    }
    return method;
  }

  const collectionName = collection['@_name'] as string | undefined;
  if (looksQualifiedTypeName(collectionName)) return collectionName;

  return undefined;
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
        const collectionRecord = collection as Record<string, unknown>;
        for (const test of asArray(collectionRecord.test as unknown)) {
          if (!test || typeof test !== 'object') continue;
          const t = test as Record<string, unknown>;
          const name = (t['@_name'] as string) ?? 'unknown';
          const typeName = resolveTypeName(t, collectionRecord);
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
