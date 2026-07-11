import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { gccClangParser } from '../../src/diagnostic-parsers/gcc-clang';
import { msbuildParser } from '../../src/diagnostic-parsers/msbuild';
import { detectDiagnosticParser, parseDiagnosticFiles, PARSERS } from '../../src/diagnostic-parsers/registry';
import { sarifParser } from '../../src/diagnostic-parsers/sarif';
import { mergeDiagnosticReports } from '../../src/diagnostic-parsers/merge';

const fixturesDir = path.join(__dirname, '../fixtures/diagnostics');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf8');
}

describe('diagnostic parsers', () => {
  it('registers parsers in detection order', () => {
    expect(PARSERS.map((p) => p.format)).toEqual(['sarif', 'msbuild', 'gcc']);
  });

  it('parses SARIF fixture', () => {
    const content = readFixture('sample.sarif');
    const report = sarifParser.parse(content, 'sample.sarif');
    expect(report.summary.errors).toBe(1);
    expect(report.summary.warnings).toBe(1);
    expect(report.items[0].file).toBe('src/app.ts');
    expect(report.items[0].code).toBe('no-unused-vars');
  });

  it('parses MSBuild log fixture', () => {
    const content = readFixture('msbuild-warnings.log');
    const report = msbuildParser.parse(content, 'msbuild-warnings.log');
    expect(report.summary.errors).toBe(1);
    expect(report.summary.warnings).toBe(2);
    expect(report.items.some((i) => i.code === 'CS0168')).toBe(true);
  });

  it('parses gcc/clang log fixture', () => {
    const content = readFixture('gcc-warnings.log');
    const report = gccClangParser.parse(content, 'gcc-warnings.log');
    expect(report.summary.errors).toBe(1);
    expect(report.summary.warnings).toBe(1);
    expect(report.summary.notes).toBe(1);
    expect(report.items[0].line).toBe(10);
  });

  it('detects SARIF by content', () => {
    const content = readFixture('sample.sarif');
    const parser = detectDiagnosticParser('results.json', content);
    expect(parser?.format).toBe('sarif');
  });

  it('merges and deduplicates diagnostics', () => {
    const content = readFixture('sample.sarif');
    const report = sarifParser.parse(content, 'sample.sarif');
    const merged = mergeDiagnosticReports([report, report]);
    expect(merged.items).toHaveLength(report.items.length);
  });

  it('parses diagnostic files via glob', async () => {
    const report = await parseDiagnosticFiles(path.join(fixturesDir, '*.sarif'));
    expect(report?.summary.warnings).toBe(1);
    expect(report?.summary.errors).toBe(1);
  });
});
