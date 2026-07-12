import * as github from '@actions/github';
import type { HistoryConfig } from '../config';
import type { RunContext } from '../model/test-run';
import { resolveBranchKey } from '../history/paths';
import { repositoryKeyFromName } from './models';

function parseOwnerRepo(full: string): { owner: string; repo: string } | undefined {
  const trimmed = (full || '').trim();
  const parts = trimmed.split('/');
  if (parts.length !== 2) return undefined;
  const [owner, repo] = parts;
  if (!owner || !repo) return undefined;
  return { owner, repo };
}

export function normalizePagesBaseUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

async function tryResolvePagesUrlFromApi(
  token: string,
  owner: string,
  repo: string,
): Promise<string | undefined> {
  if (!token) return undefined;
  try {
    const octokit = github.getOctokit(token);
    const result = await octokit.rest.repos.getPages({ owner, repo });
    const html = (result.data as { html_url?: string }).html_url;
    const normalized = html ? normalizePagesBaseUrl(html) : '';
    return normalized || undefined;
  } catch {
    return undefined;
  }
}

export async function resolveHistoryPagesBaseUrl(history: HistoryConfig): Promise<string | undefined> {
  if (!history.enabled) return undefined;

  const explicit = history.pagesUrl ? normalizePagesBaseUrl(history.pagesUrl) : '';
  if (explicit) return explicit;

  const parsed = parseOwnerRepo(history.repository);
  if (!parsed) return undefined;

  const api = await tryResolvePagesUrlFromApi(history.token, parsed.owner, parsed.repo);
  if (api) return api;

  return `https://${parsed.owner}.github.io/${parsed.repo}/`;
}

export function buildHistoryRepositoryUrl(baseUrl: string, repositoryName: string): string {
  const base = normalizePagesBaseUrl(baseUrl);
  const repoKey = repositoryKeyFromName(repositoryName);
  return `${base}#/r/${encodeURIComponent(repoKey)}`;
}

export function buildHistoryRunUrl(
  baseUrl: string,
  repositoryName: string,
  context: RunContext,
  runId: string,
): string {
  const base = normalizePagesBaseUrl(baseUrl);
  const repoKey = repositoryKeyFromName(repositoryName);
  const { branchKey } = resolveBranchKey(context);
  return `${base}#/r/${encodeURIComponent(repoKey)}/b/${encodeURIComponent(branchKey)}/run/${encodeURIComponent(
    runId,
  )}`;
}

