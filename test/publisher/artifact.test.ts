import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const uploadArtifact = vi.fn();

vi.mock('@actions/artifact', () => ({
  DefaultArtifactClient: vi.fn().mockImplementation(() => ({
    uploadArtifact,
  })),
}));

vi.mock('@actions/core', () => ({
  info: vi.fn(),
  warning: vi.fn(),
}));

import {
  ARTIFACT_NAME,
  buildArtifactDownloadUrl,
  buildHtmlArtifactFileName,
  uploadReportArtifact,
} from '../../src/publisher/artifact';

describe('artifact publisher', () => {
  let artifactDir: string;

  beforeEach(() => {
    artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-upload-'));
    fs.writeFileSync(path.join(artifactDir, 'report.html'), '<html></html>');
    fs.writeFileSync(path.join(artifactDir, 'trends.json'), '{}');
    uploadArtifact.mockReset();
  });

  afterEach(() => {
    fs.rmSync(artifactDir, { recursive: true, force: true });
  });

  it('buildHtmlArtifactFileName includes short sha and html extension', () => {
    expect(buildHtmlArtifactFileName('abc1234')).toBe(`${ARTIFACT_NAME}-abc1234.html`);
  });

  it('buildArtifactDownloadUrl appends artifact id', () => {
    expect(buildArtifactDownloadUrl('https://github.com/o/r/actions/runs/9', 42)).toBe(
      'https://github.com/o/r/actions/runs/9/artifacts/42',
    );
  });

  it('uploads unzipped HTML then zipped bundle and returns direct URL', async () => {
    uploadArtifact
      .mockResolvedValueOnce({ id: 99, size: 100 })
      .mockResolvedValueOnce({ id: 100, size: 200 });

    const result = await uploadReportArtifact(
      artifactDir,
      30,
      'abc1234',
      'https://github.com/o/r/actions/runs/9',
      { includeRawTestResults: false },
    );

    expect(result.htmlArtifactUrl).toBe('https://github.com/o/r/actions/runs/9/artifacts/99');
    expect(uploadArtifact).toHaveBeenCalledTimes(2);

    const [htmlName, htmlFiles, htmlRoot, htmlOptions] = uploadArtifact.mock.calls[0];
    expect(htmlName).toBe(`${ARTIFACT_NAME}-abc1234.html`);
    expect(htmlFiles).toHaveLength(1);
    expect(path.basename(htmlFiles[0] as string)).toBe(`${ARTIFACT_NAME}-abc1234.html`);
    expect(htmlRoot).toBe(artifactDir);
    expect(htmlOptions).toEqual({ retentionDays: 30, skipArchive: true });
    expect(fs.existsSync(path.join(artifactDir, `${ARTIFACT_NAME}-abc1234.html`))).toBe(false);

    const [bundleName, bundleFiles, bundleRoot, bundleOptions] = uploadArtifact.mock.calls[1];
    expect(bundleName).toBe(`${ARTIFACT_NAME}-abc1234`);
    expect(bundleFiles).toEqual(
      expect.arrayContaining([
        path.join(artifactDir, 'report.html'),
        path.join(artifactDir, 'trends.json'),
      ]),
    );
    expect(bundleRoot).toBe(artifactDir);
    expect(bundleOptions).toEqual({ retentionDays: 30 });
  });

  it('falls back without htmlArtifactUrl when unzipped upload fails', async () => {
    uploadArtifact
      .mockRejectedValueOnce(new Error('Artifacts v7 not supported'))
      .mockResolvedValueOnce({ id: 100, size: 200 });

    const result = await uploadReportArtifact(
      artifactDir,
      14,
      'deadbee',
      'https://github.com/o/r/actions/runs/1',
      { includeRawTestResults: false },
    );

    expect(result.htmlArtifactUrl).toBeUndefined();
    expect(uploadArtifact).toHaveBeenCalledTimes(2);
    expect(uploadArtifact.mock.calls[1][0]).toBe(`${ARTIFACT_NAME}-deadbee`);
  });
});
