import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { cacheKey } from '../history/paths';
import { ensureDir } from './site-merger';

export async function restoreSiteCache(
  siteOutput: string,
  owner: string,
  repo: string,
): Promise<boolean> {
  const prefix = cacheKey(owner, repo);
  const primaryKey = `${prefix}-${github.context.runId}`;
  const restored = await cache.restoreCache([siteOutput], primaryKey, [prefix]);
  if (restored) {
    core.info(`Restored site workspace from cache (${restored})`);
  }
  return restored !== undefined;
}

export async function saveSiteCache(siteOutput: string, owner: string, repo: string): Promise<void> {
  const prefix = cacheKey(owner, repo);
  const key = `${prefix}-${github.context.runId}`;
  try {
    await cache.saveCache([siteOutput], key);
    core.info(`Saved site workspace to cache (${key})`);
  } catch (error) {
    core.warning(
      `Failed to save site cache: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function prepareSiteWorkspace(
  siteOutput: string,
  owner: string,
  repo: string,
): Promise<void> {
  ensureDir(siteOutput);
  await restoreSiteCache(siteOutput, owner, repo);
}
