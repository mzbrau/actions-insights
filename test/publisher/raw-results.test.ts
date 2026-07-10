import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { collectArtifactFiles } from '../../src/publisher/artifact';
import { copyRawTestResults, writeRawManifest } from '../../src/publisher/raw-results';

describe('raw-results', () => {
  it('preserves workspace-relative paths and writes manifest', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-workspace-'));
    const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-artifact-'));
    const nestedDir = path.join(workspace, 'TestResults');
    fs.mkdirSync(nestedDir, { recursive: true });
    const trxPath = path.join(nestedDir, 'results.trx');
    fs.writeFileSync(trxPath, '<TestRun></TestRun>');

    const entries = copyRawTestResults([trxPath], [], artifactDir, workspace);
    writeRawManifest(artifactDir, entries);

    const copiedPath = path.join(artifactDir, 'raw', 'TestResults', 'results.trx');
    expect(fs.existsSync(copiedPath)).toBe(true);
    expect(entries[0].artifactPath).toBe('raw/TestResults/results.trx');
    expect(entries[0].parsed).toBe(false);

    const manifest = JSON.parse(fs.readFileSync(path.join(artifactDir, 'raw', 'manifest.json'), 'utf8'));
    expect(manifest.files).toHaveLength(1);
    expect(manifest.files[0].sourcePath).toBe(trxPath);

    fs.rmSync(workspace, { recursive: true, force: true });
    fs.rmSync(artifactDir, { recursive: true, force: true });
  });

  it('suffixes colliding destination paths', () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-workspace-'));
    const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-artifact-'));
    const first = path.join(workspace, 'a', 'results.trx');
    const second = path.join(workspace, 'b', 'results.trx');
    fs.mkdirSync(path.dirname(first), { recursive: true });
    fs.mkdirSync(path.dirname(second), { recursive: true });
    fs.writeFileSync(first, 'first');
    fs.writeFileSync(second, 'second');

    const entries = copyRawTestResults([first, second], [first], artifactDir, workspace);

    expect(entries.map((entry) => entry.artifactPath).sort()).toEqual([
      'raw/a/results.trx',
      'raw/b/results.trx',
    ]);
    expect(entries.find((entry) => entry.sourcePath === first)?.parsed).toBe(true);
    expect(entries.find((entry) => entry.sourcePath === second)?.parsed).toBe(false);

    fs.rmSync(workspace, { recursive: true, force: true });
    fs.rmSync(artifactDir, { recursive: true, force: true });
  });
});

describe('collectArtifactFiles', () => {
  it('includes nested raw files', () => {
    const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-collect-'));
    fs.mkdirSync(path.join(artifactDir, 'raw', 'nested'), { recursive: true });
    fs.writeFileSync(path.join(artifactDir, 'report.html'), '<html></html>');
    fs.writeFileSync(path.join(artifactDir, 'trends.json'), '{}');
    fs.writeFileSync(path.join(artifactDir, 'raw', 'nested', 'results.trx'), '<TestRun></TestRun>');
    fs.writeFileSync(path.join(artifactDir, 'raw', 'manifest.json'), '{}');

    const files = collectArtifactFiles(artifactDir).map((file) => path.relative(artifactDir, file)).sort();
    expect(files).toEqual([
      'raw/manifest.json',
      'raw/nested/results.trx',
      'report.html',
      'trends.json',
    ]);

    fs.rmSync(artifactDir, { recursive: true, force: true });
  });
});
