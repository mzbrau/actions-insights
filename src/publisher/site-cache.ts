import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { cacheKey } from '../history/paths';
import { ensureDir } from './site-merger';

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

export async function prepareSiteWorkspace(
  siteOutput: string,
  owner: string,
  repo: string,
): Promise<void> {
  ensureDir(siteOutput);
  const restored = await restoreSiteCache(siteOutput, owner, repo);
  if (restored) {
    core.info('Restored site workspace from cache');
  }
}
