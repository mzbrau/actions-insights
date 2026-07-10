import { describe, expect, it } from 'vitest';
import { coberturaParser } from '../../src/coverage-parsers/cobertura';
import { encodeCoverageRunRecord } from '../../src/model/coverage';

function buildLargeCobertura(fileCount: number): string {
  const classes = Array.from({ length: fileCount }, (_, i) => `
        <class name="App.Class${i}" filename="src/File${i}.cs" line-rate="0.5" branch-rate="0.5">
          <lines>
            <line number="1" hits="1"/>
            <line number="2" hits="0"/>
          </lines>
        </class>`).join('');
  return `<?xml version="1.0"?><coverage line-rate="0.5" branch-rate="0.5"><packages><package name="App"><classes>${classes}</classes></package></packages></coverage>`;
}

describe('coverage performance', () => {
  it('parses and encodes 2000-file Cobertura within budget', () => {
    const content = buildLargeCobertura(2000);
    const start = performance.now();
    const report = coberturaParser.parse(content, 'large.cobertura.xml');
    const encoded = encodeCoverageRunRecord('1', report);
    const elapsed = performance.now() - start;
    expect(report.projects[0].files?.length).toBe(2000);
    expect(encoded.files?.length).toBe(2000);
    expect(elapsed).toBeLessThan(5000);
  });
});
