import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let version = 'dev';

try {
  version = execSync(
    'git describe --tags --exact-match 2>/dev/null || git describe --tags --always',
    { encoding: 'utf8', cwd: webRoot },
  ).trim();
} catch {
  // no git available
}

writeFileSync(
  path.join(webRoot, 'src', 'version.ts'),
  `export const APP_VERSION = ${JSON.stringify(version)};\n`,
);
