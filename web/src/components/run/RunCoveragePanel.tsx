import { useMemo, useState } from 'react';
import type {
  CompactCoverageProject,
  CoverageMetrics,
  CoverageRunRecord,
  CoverageSummaryCompact,
} from '@actions-insights/history-models';
import { CoverageProgressBar } from '../ui/CoverageProgressBar';
import { CoverageMetricRow } from '../ui/CoverageMetricRow';
import {
  collectPackageFiles,
  collectProjectFiles,
  filterCoverageFiles,
  shouldFlattenPackages,
  sortCoverageFiles,
  fileBasename,
  type CoverageFileRow,
  type CoverageFileSortBy,
} from '../../utils/coverageDisplay';

interface RunCoveragePanelProps {
  summary: CoverageSummaryCompact;
  detail: CoverageRunRecord | null;
  detailLoading: boolean;
  onRequestDetail: () => void;
}

interface ProjectRow {
  name: string;
  metrics: CoverageMetrics;
  packages?: CompactCoverageProject['packages'];
  files?: CompactCoverageProject['files'];
}

interface ProjectFileState {
  search: string;
  sortBy: CoverageFileSortBy;
}

const FILE_SORT_OPTIONS: { value: CoverageFileSortBy; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'line-asc', label: 'Line coverage (low → high)' },
  { value: 'line-desc', label: 'Line coverage (high → low)' },
  { value: 'branch-asc', label: 'Branch coverage (low → high)' },
  { value: 'branch-desc', label: 'Branch coverage (high → low)' },
];

function CoverageFileList({
  files,
  search,
  sortBy,
  onSearchChange,
  onSortChange,
  idPrefix,
}: {
  files: CoverageFileRow[];
  search: string;
  sortBy: CoverageFileSortBy;
  onSearchChange: (value: string) => void;
  onSortChange: (value: CoverageFileSortBy) => void;
  idPrefix: string;
}) {
  const filtered = useMemo(
    () => sortCoverageFiles(filterCoverageFiles(files, search), sortBy),
    [files, search, sortBy],
  );

  if (files.length === 0) {
    return <p className="coverage-project-loading muted">No file breakdown available.</p>;
  }

  return (
    <div className="coverage-file-list">
      <div className="coverage-file-toolbar tests-toolbar-row">
        <input
          type="search"
          className="search-input"
          placeholder="Filter files…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={`Filter files for ${idPrefix}`}
        />
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as CoverageFileSortBy)}
          aria-label={`Sort files for ${idPrefix}`}
        >
          {FILE_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <p className="muted coverage-file-count">{filtered.length} file{filtered.length === 1 ? '' : 's'}</p>
      <ul className="coverage-file-rows">
        {filtered.map((file) => (
          <li key={file.path} className="coverage-file-row">
            <CoverageMetricRow
              label={fileBasename(file.path)}
              title={file.path}
              value={file.metrics.line}
              compact
            />
            {file.metrics.branch !== undefined && (
              <span className="coverage-file-branch muted">{file.metrics.branch.toFixed(1)}% branches</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RunCoveragePanel({
  summary,
  detail,
  detailLoading,
  onRequestDetail,
}: RunCoveragePanelProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [fileState, setFileState] = useState<Record<string, ProjectFileState>>({});

  const projects = useMemo((): ProjectRow[] => {
    if (detail?.projects?.length) {
      return detail.projects.map((project) => ({
        name: project.name,
        metrics: project.metrics,
        packages: project.packages,
        files: project.files,
      }));
    }
    if (summary.projects) {
      return Object.entries(summary.projects)
        .map(([name, metrics]) => ({ name, metrics }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }, [summary.projects, detail?.projects]);

  const getFileState = (projectName: string): ProjectFileState => (
    fileState[projectName] ?? { search: '', sortBy: 'line-asc' }
  );

  const updateFileState = (projectName: string, patch: Partial<ProjectFileState>) => {
    setFileState((prev) => ({
      ...prev,
      [projectName]: { ...(prev[projectName] ?? { search: '', sortBy: 'line-asc' }), ...patch },
    }));
  };

  const togglePackage = (key: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleProjectToggle = (projectName: string, open: boolean) => {
    if (open) {
      setExpandedProject(projectName);
      onRequestDetail();
    } else if (expandedProject === projectName) {
      setExpandedProject(null);
    }
  };

  const detailProject = (name: string) => detail?.projects.find((p) => p.name === name);

  return (
    <div className="tab-panel run-coverage-panel" role="tabpanel">
      <section className="coverage-run-summary">
        <CoverageProgressBar label="Line coverage" value={summary.line} variant="line" colorMode="spectrum" />
        <CoverageProgressBar label="Branch coverage" value={summary.branch} variant="branch" colorMode="spectrum" />
      </section>

      <section className="section">
        <h2 className="section-title">Projects</h2>
        {projects.length === 0 ? (
          <p className="muted">No project-level coverage breakdown available.</p>
        ) : (
          <div className="coverage-project-list">
            {projects.map((project) => {
              const detailProj = detailProject(project.name);
              const projectData = detailProj ?? project;
              const packages = projectData.packages;
              const isOpen = expandedProject === project.name;
              const flattened = detailProj ? shouldFlattenPackages(detailProj) : false;
              const state = getFileState(project.name);

              return (
                <details
                  key={project.name}
                  className="coverage-project-item"
                  open={isOpen}
                  onToggle={(e) => {
                    handleProjectToggle(project.name, (e.target as HTMLDetailsElement).open);
                  }}
                >
                  <summary className="coverage-project-summary">
                    <CoverageMetricRow
                      label={project.name}
                      value={project.metrics.line}
                    />
                    {project.metrics.branch !== undefined && (
                      <span className="coverage-project-branch muted">
                        {project.metrics.branch.toFixed(1)}% branches
                      </span>
                    )}
                  </summary>

                  {isOpen && detailLoading && !detail && (
                    <p className="coverage-project-loading muted">Loading project details…</p>
                  )}

                  {isOpen && detail && flattened && (
                    <CoverageFileList
                      idPrefix={project.name}
                      files={collectProjectFiles(detailProj!, detail)}
                      search={state.search}
                      sortBy={state.sortBy}
                      onSearchChange={(search) => updateFileState(project.name, { search })}
                      onSortChange={(sortBy) => updateFileState(project.name, { sortBy })}
                    />
                  )}

                  {isOpen && detail && !flattened && packages && packages.length > 0 && (
                    <div className="coverage-project-details">
                      {packages.map((pkg) => {
                        const pkgKey = `${project.name}::${pkg.name}`;
                        const pkgOpen = expandedPackages.has(pkgKey);
                        const pkgState = getFileState(pkgKey);
                        const pkgFiles = collectPackageFiles(pkg, detail);

                        return (
                          <details
                            key={pkgKey}
                            className="coverage-package-item"
                            open={pkgOpen}
                            onToggle={(e) => {
                              e.stopPropagation();
                              togglePackage(pkgKey);
                            }}
                          >
                            <summary className="coverage-package-summary">
                              <CoverageMetricRow label={pkg.name} value={pkg.metrics.line} compact />
                            </summary>
                            {pkgOpen && (
                              <CoverageFileList
                                idPrefix={pkgKey}
                                files={pkgFiles}
                                search={pkgState.search}
                                sortBy={pkgState.sortBy}
                                onSearchChange={(search) => updateFileState(pkgKey, { search })}
                                onSortChange={(sortBy) => updateFileState(pkgKey, { sortBy })}
                              />
                            )}
                          </details>
                        );
                      })}
                    </div>
                  )}

                  {isOpen && detail && !flattened && (!packages || packages.length === 0) && !detailLoading && (
                    <p className="coverage-project-loading muted">No package breakdown for this project.</p>
                  )}
                </details>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
