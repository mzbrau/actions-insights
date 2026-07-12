import { describe, expect, it } from 'vitest';
import type { CompactCoverageProject, CoverageRunRecord } from '@actions-insights/history-models';
import {
  buildFileGapsScope,
  buildProjectGapsScope,
  collectFileMethods,
  collectProjectFiles,
  coverageBarColor,
  filterCoverageFiles,
  formatCoverageGapsSummary,
  shouldFlattenPackages,
  sortCoverageFiles,
} from './coverageDisplay';

const projectWithMethods: CompactCoverageProject = {
  name: 'App.Api',
  metrics: { line: 50 },
  packages: [{
    name: 'App.Api',
    metrics: { line: 50 },
    classes: [{
      name: 'App.Api.Service',
      file: 'src/A.cs',
      metrics: { line: 90 },
      methods: [
        { name: 'Get', signature: '()', metrics: { line: 100 } },
        { name: 'Delete', signature: '()', metrics: { line: 50 } },
      ],
    }, {
      name: 'App.Api.Helper',
      file: 'src/B.cs',
      metrics: { line: 10 },
      methods: [
        { name: 'Run', signature: '()', metrics: { line: 0 } },
      ],
    }],
  }],
  files: [
    { p: 0, metrics: { line: 90 } },
    { p: 1, metrics: { line: 10 } },
  ],
};

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

  it('collects methods for a file from class data', () => {
    const methods = collectFileMethods('src/A.cs', projectWithMethods);
    expect(methods).toHaveLength(2);
    expect(methods.map((m) => m.label)).toEqual(['Get()', 'Delete()']);
  });

  it('prefixes method labels when multiple classes share a file', () => {
    const multiClassProject: CompactCoverageProject = {
      ...projectWithMethods,
      packages: [{
        name: 'App.Api',
        metrics: { line: 50 },
        classes: [
          {
            name: 'App.Api.PartA',
            file: 'src/Shared.cs',
            metrics: { line: 50 },
            methods: [{ name: 'Foo', metrics: { line: 40 } }],
          },
          {
            name: 'App.Api.PartB',
            file: 'src/Shared.cs',
            metrics: { line: 60 },
            methods: [{ name: 'Bar', metrics: { line: 70 } }],
          },
        ],
      }],
    };
    const methods = collectFileMethods('src/Shared.cs', multiClassProject);
    expect(methods.map((m) => m.label)).toEqual(['PartA.Foo', 'PartB.Bar']);
  });

  it('formats coverage gap summary below threshold', () => {
    const scope = buildProjectGapsScope(projectWithMethods, detail);
    const summary = formatCoverageGapsSummary(scope, 80);
    expect(summary).toContain('App.Api (50.0% line coverage)');
    expect(summary).toContain('src/B.cs (10.0%)');
    expect(summary).toContain('- Run() (0.0%)');
    expect(summary).toContain('- Delete() (50.0%)');
    expect(summary).not.toContain('Get()');
  });

  it('builds file-level gap scope', () => {
    const files = collectProjectFiles(projectWithMethods, detail);
    const scope = buildFileGapsScope(files[1], projectWithMethods);
    const summary = formatCoverageGapsSummary(scope, 80);
    expect(summary).toContain('B.cs');
    expect(summary).toContain('- Run() (0.0%)');
  });
});
