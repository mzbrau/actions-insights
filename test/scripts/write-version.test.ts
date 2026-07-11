import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const execSyncMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  execSync: execSyncMock,
}));

const { resolveVersion } = await import('../../web/scripts/write-version.mjs');

const tempRoot = join(process.cwd(), 'test', 'fixtures', 'version-tests');

function createTempDir(withGit = false): string {
  mkdirSync(tempRoot, { recursive: true });
  const dir = join(tempRoot, `repo-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  if (withGit) {
    mkdirSync(join(dir, '.git'));
  }
  return dir;
}

function writePackageVersion(dir: string, version: string): void {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ version }));
}

describe('write-version', () => {
  beforeEach(() => {
    execSyncMock.mockReset();
  });

  afterEach(() => {
    if (existsSync(tempRoot)) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('git-describe returns git describe output when tags exist', () => {
    const dir = createTempDir(true);

    execSyncMock.mockImplementation((command: string) => {
      if (command.includes('git describe --tags') && !command.includes('exact-match')) {
        return 'v2.0.0-1-gabc1234';
      }
      throw new Error(`unexpected command: ${command}`);
    });

    expect(resolveVersion(dir, 'git-describe')).toBe('v2.0.0-1-gabc1234');
    expect(resolveVersion(dir, 'git-describe')).not.toBe('main');
  });

  it('git-describe falls back to package.json when no tags exist', () => {
    const dir = createTempDir();
    writePackageVersion(dir, '2.0.0');

    execSyncMock.mockImplementation(() => {
      throw new Error('no tags');
    });

    expect(resolveVersion(dir, 'git-describe')).toBe('v2.0.0');
  });

  it('git-describe falls back to dev when no tags or package version exist', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, 'README.md'), '# test\n');

    execSyncMock.mockImplementation(() => {
      throw new Error('no tags');
    });

    expect(resolveVersion(dir, 'git-describe')).toBe('dev');
  });

  it('release prefers exact tag at HEAD', () => {
    const dir = createTempDir(true);

    execSyncMock.mockImplementation((command: string) => {
      if (command.includes('git describe --tags --exact-match')) {
        return 'v2.0.0';
      }
      throw new Error(`unexpected command: ${command}`);
    });

    expect(resolveVersion(dir, 'release')).toBe('v2.0.0');
  });

  it('release falls back to package.json when HEAD is not an exact tag', () => {
    const dir = createTempDir();
    writePackageVersion(dir, '2.0.0');

    execSyncMock.mockImplementation((command: string) => {
      if (command.includes('git describe --tags --exact-match')) {
        throw new Error('not an exact tag');
      }
      throw new Error(`unexpected command: ${command}`);
    });

    expect(resolveVersion(dir, 'release')).toBe('v2.0.0');
  });

  it('CLI writes stamped version to a custom output path', async () => {
    const dir = createTempDir();
    const outputPath = join(dir, 'web', 'src', 'version.ts');
    writePackageVersion(dir, '2.0.0');

    const { execFileSync } = await vi.importActual<typeof import('node:child_process')>('node:child_process');
    execFileSync(
      'node',
      [
        'web/scripts/write-version.mjs',
        '--repo-root',
        dir,
        '--output',
        outputPath,
        '--strategy',
        'git-describe',
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );

    const contents = readFileSync(outputPath, 'utf8');
    expect(contents).toBe('export const APP_VERSION = "v2.0.0";\n');
    expect(contents).not.toContain('"main"');
  });
});
