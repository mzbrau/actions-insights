import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { junitParser } from '../../src/parsers/junit';
import { nunitParser } from '../../src/parsers/nunit';
import { trxParser } from '../../src/parsers/trx';
import { xunitParser } from '../../src/parsers/xunit';
import { detectParser, parseTestFiles } from '../../src/parsers/registry';
import * as fs from 'fs';

const fixtures = path.join(__dirname, '..', 'fixtures');

describe('TRX parser', () => {
  it('parses pass, fail, and skip outcomes', () => {
    const content = fs.readFileSync(path.join(fixtures, 'sample.trx'), 'utf8');
    const cases = trxParser.parse(content, 'sample.trx');
    expect(cases).toHaveLength(3);
    expect(cases.find((c) => c.name === 'ShouldPass')?.outcome).toBe('passed');
    expect(cases.find((c) => c.name === 'ShouldFail')?.outcome).toBe('failed');
    expect(cases.find((c) => c.name === 'ShouldFail')?.stackTrace).toContain('line 42');
    expect(cases.find((c) => c.name === 'ShouldSkip')?.outcome).toBe('skipped');
  });

  it('parses TRX files with more than 1000 XML entity expansions', () => {
    const content = fs.readFileSync(path.join(fixtures, 'large-entities.trx'), 'utf8');
    const cases = trxParser.parse(content, 'large-entities.trx');
    expect(cases).toHaveLength(1);
    expect(cases[0].name).toBe('LargeOutput');
    expect(cases[0].stdout).toBe('&'.repeat(1200));
  });
});

describe('JUnit parser', () => {
  it('parses junit xml', () => {
    const content = fs.readFileSync(path.join(fixtures, 'junit.xml'), 'utf8');
    const cases = junitParser.parse(content, 'junit.xml');
    expect(cases).toHaveLength(3);
    expect(cases.filter((c) => c.outcome === 'failed')).toHaveLength(1);
    expect(cases.filter((c) => c.outcome === 'skipped')).toHaveLength(1);
  });
});

describe('NUnit parser', () => {
  it('parses nunit xml', () => {
    const content = fs.readFileSync(path.join(fixtures, 'nunit.xml'), 'utf8');
    const cases = nunitParser.parse(content, 'nunit.xml');
    expect(cases).toHaveLength(2);
    expect(cases.find((c) => c.name === 'FailingTest')?.message).toContain('Assert failed');
  });
});

describe('xUnit parser', () => {
  it('parses xunit xml', () => {
    const content = fs.readFileSync(path.join(fixtures, 'xunit.xml'), 'utf8');
    const cases = xunitParser.parse(content, 'xunit.xml');
    expect(cases).toHaveLength(2);
    expect(cases.find((c) => c.name === 'FailingTest')?.outcome).toBe('failed');
  });
});

describe('parser registry', () => {
  it('detects TRX by extension', () => {
    const content = fs.readFileSync(path.join(fixtures, 'sample.trx'), 'utf8');
    expect(detectParser('results.trx', content)?.format).toBe('trx');
  });

  it('parses files via glob', async () => {
    const { tests, sourceFiles, matchedFiles } = await parseTestFiles('sample.trx', fixtures);
    expect(sourceFiles).toHaveLength(1);
    expect(sourceFiles[0]).toContain('sample.trx');
    expect(matchedFiles).toHaveLength(1);
    expect(matchedFiles[0]).toContain('sample.trx');
    expect(tests).toHaveLength(3);
  });

  it('returns unparsed JSON files in matchedFiles', async () => {
    const { tests, sourceFiles, matchedFiles } = await parseTestFiles('jest-results.json', fixtures);
    expect(tests).toHaveLength(0);
    expect(sourceFiles).toHaveLength(0);
    expect(matchedFiles).toHaveLength(1);
    expect(matchedFiles[0]).toContain('jest-results.json');
  });
});
