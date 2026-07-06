import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';
import { copyDirSync, ensureDir } from './site-merger';

export async function publishToGhPagesBranch(
  siteOutput: string,
  pagesSubdirectory: string,
  token: string,
  message: string,
): Promise<void> {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GITHUB_REPOSITORY is not set');

  const workDir = path.join(process.cwd(), '.gh-pages-publish');
  if (fs.existsSync(workDir)) {
    fs.rmSync(workDir, { recursive: true, force: true });
  }

  await exec.exec('git', [
    'clone',
    '--depth',
    '1',
    '--branch',
    'gh-pages',
    `https://x-access-token:${token}@github.com/${repo}.git`,
    workDir,
  ], { silent: true, ignoreReturnCode: true });

  if (!fs.existsSync(path.join(workDir, '.git'))) {
    ensureDir(workDir);
    await exec.exec('git', ['init'], { cwd: workDir });
    await exec.exec('git', ['checkout', '-b', 'gh-pages'], { cwd: workDir });
  }

  const target = path.join(workDir, pagesSubdirectory);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
  const source = path.join(siteOutput, pagesSubdirectory);
  copyDirSync(source, target);

  for (const entry of fs.readdirSync(siteOutput, { withFileTypes: true })) {
    if (entry.name === pagesSubdirectory) continue;
    const srcPath = path.join(siteOutput, entry.name);
    const destPath = path.join(workDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  await exec.exec('git', ['config', 'user.name', 'github-actions[bot]'], { cwd: workDir });
  await exec.exec('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], { cwd: workDir });
  await exec.exec('git', ['add', '-A'], { cwd: workDir });
  await exec.exec('git', ['commit', '-m', message, '--allow-empty'], { cwd: workDir, ignoreReturnCode: true });
  await exec.exec('git', ['push', 'origin', 'gh-pages', '--force'], { cwd: workDir });

  fs.rmSync(workDir, { recursive: true, force: true });
}
