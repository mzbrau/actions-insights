import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultRepoRoot = path.resolve(webRoot, '..');
const defaultVersionPath = path.join(webRoot, 'src', 'version.ts');

export function isHistoryRepo(repoRoot) {
  const configPath = path.join(repoRoot, 'config.json');
  if (!existsSync(configPath)) return false;

  try {
    const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
    return Object.prototype.hasOwnProperty.call(cfg, 'defaultRepository');
  } catch {
    return false;
  }
}

function runGit(repoRoot, command) {
  if (!existsSync(path.join(repoRoot, '.git'))) {
    throw new Error('not a git repository');
  }

  return execSync(command, { encoding: 'utf8', cwd: repoRoot }).trim();
}

function readPackageVersion(repoRoot) {
  const pkgPath = path.join(repoRoot, 'package.json');
  if (!existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return typeof pkg.version === 'string' && pkg.version ? `v${pkg.version}` : null;
  } catch {
    return null;
  }
}

export function resolveVersion(repoRoot, strategy = 'release') {
  if (strategy === 'git-describe') {
    try {
      return runGit(repoRoot, 'git describe --tags 2>/dev/null');
    } catch {
      const packageVersion = readPackageVersion(repoRoot);
      if (packageVersion) {
        return packageVersion;
      }
      return 'dev';
    }
  }

  try {
    return runGit(repoRoot, 'git describe --tags --exact-match 2>/dev/null');
  } catch {
    const packageVersion = readPackageVersion(repoRoot);
    if (packageVersion) {
      return packageVersion;
    }

    try {
      return runGit(repoRoot, 'git describe --tags 2>/dev/null');
    } catch {
      return 'dev';
    }
  }
}

function parseArgs(argv) {
  const args = {
    repoRoot: null,
    output: null,
    strategy: 'release',
    explicit: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--repo-root') {
      args.repoRoot = path.resolve(argv[++i]);
      args.explicit = true;
    } else if (arg === '--output') {
      args.output = path.resolve(argv[++i]);
      args.explicit = true;
    } else if (arg === '--strategy') {
      args.strategy = argv[++i];
      args.explicit = true;
    }
  }

  return args;
}

function writeVersionFile(versionPath, version) {
  mkdirSync(path.dirname(versionPath), { recursive: true });
  writeFileSync(
    versionPath,
    `export const APP_VERSION = ${JSON.stringify(version)};\n`,
  );
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = args.repoRoot ?? defaultRepoRoot;
  const versionPath = args.output ?? defaultVersionPath;

  if (!args.explicit && isHistoryRepo(repoRoot) && existsSync(versionPath)) {
    process.exit(0);
  }

  const version = resolveVersion(repoRoot, args.strategy);
  writeVersionFile(versionPath, version);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main();
}
