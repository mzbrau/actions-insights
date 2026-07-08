import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { BranchIndexEntry, RepositoryIndexEntry } from '@actions-insights/history-models';
import { loadBranchesIndex, loadRepositoriesIndex } from '../../data/loader';
import { statusIcon } from '../../utils/format';

const EXPANDED_KEY = 'actions-insights-expanded-repos';

function readExpanded(): Set<string> {
  try {
    const raw = sessionStorage.getItem(EXPANDED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function writeExpanded(expanded: Set<string>) {
  try {
    sessionStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
  } catch {}
}

interface SidebarTreeProps {
  onNavigate?: () => void;
}

export function SidebarTree({ onNavigate }: SidebarTreeProps) {
  const { repoKey: activeRepoKey } = useParams<{ repoKey?: string }>();
  const [searchParams] = useSearchParams();
  const activeBranchKey = searchParams.get('branch') ?? '';

  const [repos, setRepos] = useState<RepositoryIndexEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(readExpanded);
  const [branchesByRepo, setBranchesByRepo] = useState<Map<string, BranchIndexEntry[]>>(new Map());
  const [loadingRepos, setLoadingRepos] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const index = await loadRepositoriesIndex();
        if (!cancelled) setRepos(index.repositories);
      } finally {
        if (!cancelled) setLoadingRepos(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadedRef = useRef<Set<string>>(new Set());

  const loadBranches = useCallback(async (key: string) => {
    if (loadedRef.current.has(key)) return;
    loadedRef.current.add(key);
    try {
      const data = await loadBranchesIndex(key);
      setBranchesByRepo((prev) => new Map(prev).set(key, data.branches));
    } catch {
      setBranchesByRepo((prev) => new Map(prev).set(key, []));
    }
  }, []);

  useEffect(() => {
    if (activeRepoKey) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(activeRepoKey);
        writeExpanded(next);
        return next;
      });
      void loadBranches(activeRepoKey);
    }
  }, [activeRepoKey, loadBranches]);

  const toggleRepo = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeExpanded(next);
      return next;
    });
    void loadBranches(key);
  };

  if (loadingRepos) {
    return <p className="sidebar-loading muted">Loading…</p>;
  }

  return (
    <nav className="sidebar-tree" aria-label="Repository navigation">
      <div className="sidebar-section">
        <div className="sidebar-section-label">Repositories</div>
        {repos.map((repo) => {
          const isExpanded = expanded.has(repo.key);
          const isActiveRepo = repo.key === activeRepoKey;
          const branches = branchesByRepo.get(repo.key) ?? [];
          const regularBranches = branches.filter((b) => b.type === 'branch' || b.type === 'tag');
          const prBranches = branches.filter((b) => b.type === 'pr');

          return (
            <div key={repo.key} className="sidebar-repo">
              <div className="sidebar-repo-row">
                <button
                  type="button"
                  className="sidebar-expand-btn"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  onClick={() => toggleRepo(repo.key)}
                >
                  {isExpanded ? '▾' : '▸'}
                </button>
                <Link
                  to={`/r/${repo.key}`}
                  className={`sidebar-link${isActiveRepo && !activeBranchKey ? ' active' : ''}`}
                  onClick={onNavigate}
                >
                  <span aria-hidden="true">{statusIcon(repo.latestStatus)}</span>
                  <span className="sidebar-link-text">{repo.name}</span>
                </Link>
              </div>

              {isExpanded && (
                <div className="sidebar-children">
                  {regularBranches.length > 0 && (
                    <>
                      <div className="sidebar-group-label">Branches</div>
                      {regularBranches.map((branch) => (
                        <Link
                          key={branch.key}
                          to={`/r/${repo.key}?branch=${encodeURIComponent(branch.key)}`}
                          className={`sidebar-link sidebar-link-nested${
                            isActiveRepo && activeBranchKey === branch.key ? ' active' : ''
                          }`}
                          onClick={onNavigate}
                        >
                          <span aria-hidden="true">{statusIcon(branch.latestStatus)}</span>
                          <span className="sidebar-link-text">{branch.label}</span>
                        </Link>
                      ))}
                    </>
                  )}
                  {prBranches.length > 0 && (
                    <>
                      <div className="sidebar-group-label">Pull Requests</div>
                      {prBranches.map((branch) => (
                        <Link
                          key={branch.key}
                          to={`/r/${repo.key}?branch=${encodeURIComponent(branch.key)}`}
                          className={`sidebar-link sidebar-link-nested${
                            isActiveRepo && activeBranchKey === branch.key ? ' active' : ''
                          }`}
                          onClick={onNavigate}
                        >
                          <span aria-hidden="true">{statusIcon(branch.latestStatus)}</span>
                          <span className="sidebar-link-text">{branch.label}</span>
                        </Link>
                      ))}
                    </>
                  )}
                  {branches.length === 0 && branchesByRepo.has(repo.key) && (
                    <p className="sidebar-empty muted">No branches</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
