import * as artifact from '@actions/artifact';
import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';
import { cacheKey } from '../history/paths';
import { copyDirSync, ensureDir } from './site-merger';

export async function restoreSiteCache(
  siteOutput: string,
  owner: string,
  repo: string,
): Promise<boolean> {
  const key = cacheKey(owner, repo);
  const restored = await cache.restoreCache([siteOutput], key);
  return restored !== undefined;
}

export async function saveSiteCache(siteOutput: string, owner: string, repo: string): Promise<void> {
  const key = cacheKey(owner, repo);
  await cache.saveCache([siteOutput], key);
}

export async function seedFromGhPagesBranch(siteOutput: string, token: string): Promise<boolean> {
  ensureDir(siteOutput);
  const tempDir = path.join(process.cwd(), '.gh-pages-seed');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) return false;

  const code = await exec.exec(
    'git',
    ['clone', '--depth', '1', '--branch', 'gh-pages', `https://x-access-token:${token}@github.com/${repo}.git`, tempDir],
    { silent: true, ignoreReturnCode: true },
  );

  if (code === 0 && fs.existsSync(tempDir)) {
    copyDirSync(tempDir, siteOutput);
    fs.rmSync(tempDir, { recursive: true, force: true });
    return true;
  }

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  return false;
}

export async function prepareSiteWorkspace(
  siteOutput: string,
  owner: string,
  repo: string,
  seedFromGhPages: boolean,
  token: string,
): Promise<void> {
  ensureDir(siteOutput);
  const restored = await restoreSiteCache(siteOutput, owner, repo);
  if (!restored && seedFromGhPages) {
    const seeded = await seedFromGhPagesBranch(siteOutput, token);
    if (seeded) {
      core.info('Seeded site workspace from gh-pages branch');
    }
  } else if (restored) {
    core.info('Restored site workspace from cache');
  }
}

export async function uploadPagesArtifact(siteOutput: string): Promise<void> {
  if (!fs.existsSync(siteOutput)) {
    throw new Error(`Site output directory does not exist: ${siteOutput}`);
  }

  const tarPath = path.join(process.cwd(), 'github-pages.tar');
  if (fs.existsSync(tarPath)) {
    fs.unlinkSync(tarPath);
  }

  await exec.exec('tar', ['-cf', tarPath, '-C', siteOutput, '.'], { silent: true });

  const client = new artifact.DefaultArtifactClient();
  await client.uploadArtifact('github-pages', [tarPath], path.dirname(tarPath), {
    retentionDays: 1,
  });

  fs.unlinkSync(tarPath);
  core.info('Uploaded github-pages artifact for deployment');
}
