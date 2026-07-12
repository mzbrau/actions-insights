import { describe, expect, it } from 'vitest';
import {
  decodeCoverageRunRecord,
  encodeCoverageRunRecord,
  type CoverageReport,
} from '@actions-insights/history-models';

function multiProjectReport(): CoverageReport {
  return {
    summary: { line: 50, branch: 40 },
    sourceFiles: ['coverage.xml'],
    projects: [
      {
        name: 'App.Api',
        metrics: { line: 80, coveredLines: 8, totalLines: 10 },
        files: [
          { path: 'src/App.Api/Program.cs', metrics: { line: 80, coveredLines: 8, totalLines: 10 } },
          { path: 'src/App.Api/Startup.cs', metrics: { line: 60, coveredLines: 6, totalLines: 10 } },
        ],
        packages: [{
          name: 'App.Api',
          metrics: { line: 80 },
          classes: [
            {
              name: 'Program',
              file: 'src/App.Api/Program.cs',
              metrics: { line: 80 },
              methods: [
                { name: 'Main', signature: '()', metrics: { line: 100 } },
                { name: 'Configure', signature: '()', metrics: { line: 50 } },
              ],
            },
          ],
        }],
      },
      {
        name: 'App.Client',
        metrics: { line: 20, coveredLines: 2, totalLines: 10 },
        files: [
          { path: 'src/App.Client/Client.cs', metrics: { line: 20, coveredLines: 2, totalLines: 10 } },
        ],
        packages: [{
          name: 'App.Client',
          metrics: { line: 20 },
          classes: [
            { name: 'Client', file: 'src/App.Client/Client.cs', metrics: { line: 20 } },
          ],
        }],
      },
    ],
  };
}

describe('coverage run record encode/decode', () => {
  it('stores files scoped per project', () => {
    const encoded = encodeCoverageRunRecord('run-1', multiProjectReport());

    expect(encoded.projects[0].files).toHaveLength(2);
    expect(encoded.projects[1].files).toHaveLength(1);
    expect(encoded.paths).toEqual([
      'src/App.Api/Program.cs',
      'src/App.Api/Startup.cs',
      'src/App.Client/Client.cs',
    ]);
    expect(encoded.projects[0].files!.map((f) => encoded.paths![f.p])).toEqual([
      'src/App.Api/Program.cs',
      'src/App.Api/Startup.cs',
    ]);
    expect(encoded.projects[1].files![0].p).toBe(2);
  });

  it('decode assigns files to the correct project only', () => {
    const encoded = encodeCoverageRunRecord('run-1', multiProjectReport());
    const decoded = decodeCoverageRunRecord(encoded);

    expect(decoded.projects[0].files?.map((f) => f.path)).toEqual([
      'src/App.Api/Program.cs',
      'src/App.Api/Startup.cs',
    ]);
    expect(decoded.projects[1].files?.map((f) => f.path)).toEqual([
      'src/App.Client/Client.cs',
    ]);
  });

  it('round-trips method data under classes', () => {
    const encoded = encodeCoverageRunRecord('run-1', multiProjectReport());
    const decoded = decodeCoverageRunRecord(encoded);
    const methods = decoded.projects[0].packages?.[0].classes?.[0].methods;
    expect(methods).toHaveLength(2);
    expect(methods?.[0].name).toBe('Main');
    expect(methods?.[1].metrics.line).toBe(50);
  });

  it('falls back to class file paths when project.files is missing', () => {
    const encoded = encodeCoverageRunRecord('run-1', multiProjectReport());
    const legacy = {
      ...encoded,
      projects: encoded.projects.map(({ files: _files, ...project }) => project),
    };
    const decoded = decodeCoverageRunRecord(legacy);

    expect(decoded.projects[0].files?.map((f) => f.path)).toEqual([
      'src/App.Api/Program.cs',
    ]);
    expect(decoded.projects[1].files?.map((f) => f.path)).toEqual([
      'src/App.Client/Client.cs',
    ]);
  });
});
