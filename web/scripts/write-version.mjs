import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(webRoot, '..');
const versionPath = path.join(webRoot, 'src', 'version.ts');

function isHistoryRepo() {
  const configPath = path.join(repoRoot, 'config.json');
  if (!existsSync(configPath)) return false;

  try {
    const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
    return Object.prototype.hasOwnProperty.call(cfg, 'defaultRepository');
  } catch {
    return false;
  }
}

if (isHistoryRepo() && existsSync(versionPath)) {
  process.exit(0);
}

function runGit(command) {
  return execSync(command, { encoding: 'utf8', cwd: repoRoot }).trim();
}

function readPackageVersion() {
  const pkgPath = path.join(repoRoot, 'package.json');
  if (!existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return typeof pkg.version === 'string' && pkg.version ? `v${pkg.version}` : null;
  } catch {
    return null;
  }
}

let version = 'dev';

try {
  version = runGit('git describe --tags --exact-match 2>/dev/null');
} catch {
  const packageVersion = readPackageVersion();
  if (packageVersion) {
    version = packageVersion;
  } else {
    try {
      version = runGit('git describe --tags 2>/dev/null');
    } catch {
      // no git available or no tags
    }
  }
}

writeFileSync(
  versionPath,
  `export const APP_VERSION = ${JSON.stringify(version)};\n`,
);
