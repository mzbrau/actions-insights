import type {
  BranchHistory,
  BranchLatest,
  BranchesIndex,
  HistoryRepoConfig,
  RepositoriesIndex,
  RepositoryMetadata,
  RepositoryTestsFile,
  RunRecord,
} from '@actions-insights/history-models';

const cache = new Map<string, unknown>();

function dataUrl(relative: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalized = relative.replace(/^\//, '');
  return `${base}${normalized}`;
}

async function fetchJson<T>(relative: string): Promise<T> {
  const url = dataUrl(relative);
  if (cache.has(url)) return cache.get(url) as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${relative}: ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(url, data);
  return data;
}

export function clearDataCache(): void {
  cache.clear();
}

export function loadConfig(): Promise<HistoryRepoConfig> {
  return fetchJson<HistoryRepoConfig>('config.json').catch(() => ({}));
}

export function loadRepositoriesIndex(): Promise<RepositoriesIndex> {
  return fetchJson<RepositoriesIndex>('data/repositories.json');
}

export function loadRepositoryMetadata(repoKey: string): Promise<RepositoryMetadata> {
  return fetchJson<RepositoryMetadata>(`data/repositories/${repoKey}/metadata.json`);
}

export function loadBranchesIndex(repoKey: string): Promise<BranchesIndex> {
  return fetchJson<BranchesIndex>(`data/repositories/${repoKey}/branches.json`);
}

export function loadBranchLatest(repoKey: string, branchKey: string): Promise<BranchLatest> {
  return fetchJson<BranchLatest>(`data/repositories/${repoKey}/branches/${branchKey}/latest.json`);
}

export function loadBranchHistory(repoKey: string, branchKey: string): Promise<BranchHistory> {
  return fetchJson<BranchHistory>(`data/repositories/${repoKey}/branches/${branchKey}/history.json`);
}

export function loadRun(
  repoKey: string,
  branchKey: string,
  runFile: string,
): Promise<RunRecord> {
  return fetchJson<RunRecord>(`data/repositories/${repoKey}/branches/${branchKey}/runs/${runFile}`);
}

export interface RepositoryData {
  metadata: RepositoryMetadata;
  branches: BranchesIndex;
}

export async function loadRepository(repoKey: string): Promise<RepositoryData> {
  const [metadata, branches] = await Promise.all([
    loadRepositoryMetadata(repoKey),
    loadBranchesIndex(repoKey),
  ]);
  return { metadata, branches };
}

export async function loadRepositoryTests(repoKey: string): Promise<RepositoryTestsFile | null> {
  try {
    return await fetchJson<RepositoryTestsFile>(`data/repositories/${repoKey}/tests.json`);
  } catch {
    return null;
  }
}
