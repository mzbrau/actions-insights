import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { coberturaParser } from '../../src/coverage-parsers/cobertura';
import { jacocoParser } from '../../src/coverage-parsers/jacoco';
import { lcovParser } from '../../src/coverage-parsers/lcov';
import { mergeCoverageReports } from '../../src/coverage-parsers/merge';
import { opencoverParser } from '../../src/coverage-parsers/opencover';
import { detectCoverageParser } from '../../src/coverage-parsers/registry';
import { validateCoverageReport } from '../../src/coverage-parsers/validate';

const fixturesDir = path.join(__dirname, '../fixtures/coverage');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf8');
}

describe('coverage parsers', () => {
  it('parses Cobertura XML', () => {
    const content = readFixture('cobertura.xml');
    const report = coberturaParser.parse(content, '/tmp/coverage.cobertura.xml');
    expect(report.summary.line).toBe(75);
    expect(report.summary.totalLines).toBe(4);
    expect(report.projects[0].name).toBe('MyApp');
    expect(report.projects[0].packages?.[0].classes?.[0].name).toContain('Calculator');
    expect(validateCoverageReport(report).filter((i) => i.level === 'error')).toHaveLength(0);
    expect(report).toMatchSnapshot();
  });

  it('uses package name instead of GUID folder for Cobertura project name', () => {
    const content = readFixture('cobertura.xml');
    const guidPath = '/build/TestResults/0d25845c-895f-41e0-8cad-570d520d20e4/coverage.cobertura.xml';
    const report = coberturaParser.parse(content, guidPath);
    expect(report.projects[0].name).toBe('MyApp');
    expect(report.projects[0].name).not.toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('parses OpenCover moduleName attribute', () => {
    const content = readFixture('opencover.xml');
    const report = opencoverParser.parse(content, '/tmp/opencover.xml');
    expect(report.projects[0].name).toBe('MyApp');
  });

  it('parses JaCoCo XML', () => {
    const content = readFixture('jacoco.xml');
    const report = jacocoParser.parse(content, '/tmp/jacoco.xml');
    expect(report.summary.line).toBe(75);
    expect(report.summary.branch).toBe(50);
    expect(report).toMatchSnapshot();
  });

  it('parses OpenCover XML', () => {
    const content = readFixture('opencover.xml');
    const report = opencoverParser.parse(content, '/tmp/opencover.xml');
    expect(report.summary.line).toBeGreaterThan(0);
    expect(report.projects[0].files?.length).toBeGreaterThan(0);
    expect(report).toMatchSnapshot();
  });

  it('parses LCOV', () => {
    const content = readFixture('lcov.info');
    const report = lcovParser.parse(content, '/tmp/lcov.info');
    expect(report.summary.line).toBeGreaterThan(0);
    expect(report.projects[0].files?.length).toBe(2);
    expect(report).toMatchSnapshot();
  });

  it('detects parser by content', () => {
    expect(detectCoverageParser('x.xml', readFixture('cobertura.xml'))?.format).toBe('cobertura');
    expect(detectCoverageParser('x.xml', readFixture('jacoco.xml'))?.format).toBe('jacoco');
    expect(detectCoverageParser('x.xml', readFixture('opencover.xml'))?.format).toBe('opencover');
    expect(detectCoverageParser('x.info', readFixture('lcov.info'))?.format).toBe('lcov');
  });

  it('merges multiple coverage reports', () => {
    const a = coberturaParser.parse(readFixture('cobertura.xml'), '/a/coverage.cobertura.xml');
    const b = lcovParser.parse(readFixture('lcov.info'), '/b/lcov.info');
    const merged = mergeCoverageReports([a, b]);
    expect(merged.projects.length).toBeGreaterThan(1);
    expect(merged.summary.line).toBeDefined();
  });
});
