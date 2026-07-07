import type { TestCase } from '../model/test-case';
import { formatDuration } from '../model/test-run';
import type { ReportLinks } from './links';
import {
  classOutcomeCounts,
  formatAllTestLine,
} from './slow-tests';
import { getShortTestName, groupTestsByClassWithFailuresFirst } from './grouping';

const MAX_SUMMARY_BYTES = 55_000;

export function formatAllTestsSection(
  tests: TestCase[],
  links: ReportLinks,
  formatName: (test: TestCase) => string = (t) => `\`${t.fullName}\``,
): string[] {
  if (tests.length === 0) return [];

  const lines: string[] = [
    `## All Tests (${tests.length.toLocaleString()})`,
    '',
  ];

  const groups = groupTestsByClassWithFailuresFirst(tests);
  let bytesUsed = lines.join('\n').length;

  for (const group of groups) {
    const hasFailure = group.tests.some((t) => t.outcome === 'failed');
    const counts = classOutcomeCounts(group.tests);
    const header = `### ${group.qualifiedClassName} (${counts})`;
    const testLines = group.tests.map((t) => formatAllTestLine(t, formatName(t)));

    const expandedBlock = [header, ...testLines, ''].join('\n');
    const collapsedBlock = [
      `<details><summary>${group.qualifiedClassName} (${counts})</summary>`,
      '',
      ...testLines,
      '',
      '</details>',
      '',
    ].join('\n');

    const block = hasFailure ? expandedBlock : collapsedBlock;

    if (bytesUsed + block.length > MAX_SUMMARY_BYTES) {
      const remaining = tests.length - countRenderedTests(groups, groups.indexOf(group));
      lines.push(`_…and ${remaining.toLocaleString()} more tests. [View complete report in artifacts](${links.artifacts})_`);
      lines.push('');
      break;
    }

    lines.push(block);
    bytesUsed += block.length;
  }

  return lines;
}

function countRenderedTests(groups: ReturnType<typeof groupTestsByClassWithFailuresFirst>, fromIndex: number): number {
  let count = 0;
  for (let i = 0; i < fromIndex; i++) {
    count += groups[i].tests.length;
  }
  return count;
}
