import { describe, expect, it } from 'vitest';
import type { TestCase } from '../../src/model/test-case';
import { formatSlowTestsSection, SLOW_VISIBLE } from '../../src/reporting/slow-tests';

function makeTest(fullName: string, durationMs: number): TestCase {
  const method = fullName.split('.').pop() ?? fullName;
  return {
    id: fullName,
    name: method,
    fullName,
    method,
    outcome: 'passed',
    durationMs,
    attachments: [],
    traits: [],
    categories: [],
    retries: 0,
    sourceFile: 'test.trx',
  };
}

describe('slow-tests', () => {
  it('shows top 3 slow tests and collapses the rest', () => {
    const tests = Array.from({ length: 8 }, (_, i) =>
      makeTest(`SampleTests.Test${i}`, (8 - i) * 1000),
    );
    const lines = formatSlowTestsSection(tests, 1000, {
      splitCollapsed: true,
      formatName: (t) => `\`${t.name}\``,
    });
    const body = formatSlowTestsSection(tests, 1000, {
      splitCollapsed: true,
      formatName: (t) => `\`${t.name}\``,
    }).join('\n');
    expect(body).toContain('## Slowest Tests');
    expect(body).toContain('<details><summary>5 more slow tests</summary>');
    expect(body).not.toContain('### ');
    const visibleCount = (body.match(/^- /gm) ?? []).length;
    expect(visibleCount).toBeGreaterThanOrEqual(SLOW_VISIBLE);
  });

  it('lists all slow tests without collapse when splitCollapsed is false', () => {
    const tests = [
      makeTest('SampleTests.SlowOne', 5000),
      makeTest('SampleTests.SlowTwo', 4000),
    ];
    const body = formatSlowTestsSection(tests, 1000, {
      formatName: (t) => `\`${t.name}\``,
    }).join('\n');
    expect(body).not.toContain('<details>');
    expect(body).toContain('SlowOne');
    expect(body).toContain('SlowTwo');
  });
});
