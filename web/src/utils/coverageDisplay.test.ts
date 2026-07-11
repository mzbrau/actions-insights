import { describe, expect, it } from 'vitest';
import type { CompactCoverageProject, CoverageRunRecord } from '@actions-insights/history-models';
import {
  collectProjectFiles,
  coverageBarColor,
  filterCoverageFiles,
  shouldFlattenPackages,
  sortCoverageFiles,
} from './coverageDisplay';

const detail: CoverageRunRecord = {
  version: 2,
  runId: '1',
  summary: { line: 50 },
  paths: ['src/A.cs', 'src/B.cs', 'src/C.cs'],
  files: [
    { p: 0, metrics: { line: 90 } },
    { p: 1, metrics: { line: 10 } },
    { p: 2, metrics: { line: 50 } },
  ],
  projects: [
    {
      name: 'App.Api',
      metrics: { line: 50 },
      files: [
        { p: 0, metrics: { line: 90 } },
        { p: 1, metrics: { line: 10 } },
      ],
      packages: [{ name: 'App.Api', metrics: { line: 50 }, classes: [] }],
    },
    {
      name: 'App.Client',
      metrics: { line: 50 },
      files: [{ p: 2, metrics: { line: 50 } }],
      packages: [{ name: 'Other', metrics: { line: 50 }, classes: [] }],
    },
  ],
};

describe('coverageDisplay', () => {
  it('maps low coverage to red and high to green hues', () => {
    expect(coverageBarColor(10)).toMatch(/hsl\(12,/);
    expect(coverageBarColor(80)).toMatch(/hsl\(96,/);
  });

  it('detects redundant single package with same name as project', () => {
    expect(shouldFlattenPackages(detail.projects[0])).toBe(true);
    expect(shouldFlattenPackages(detail.projects[1])).toBe(false);
  });

  it('collects files scoped to project.files', () => {
    const files = collectProjectFiles(detail.projects[0], detail);
    expect(files.map((f) => f.path)).toEqual(['src/A.cs', 'src/B.cs']);
    expect(files[0].metrics.line).toBe(90);
  });

  it('filters and sorts files by coverage', () => {
    const files = collectProjectFiles(detail.projects[0], detail);
    expect(filterCoverageFiles(files, 'b.cs')).toHaveLength(1);
    expect(sortCoverageFiles(files, 'line-asc').map((f) => f.metrics.line)).toEqual([10, 90]);
    expect(sortCoverageFiles(files, 'line-desc').map((f) => f.metrics.line)).toEqual([90, 10]);
  });
});
