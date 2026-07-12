import { useMemo, useState } from 'react';
import type {
  CompactCoverageProject,
  CoverageMetrics,
  CoverageRunRecord,
  CoverageSummaryCompact,
} from '@actions-insights/history-models';
import { CoverageProgressBar } from '../ui/CoverageProgressBar';
import { CoverageMetricRow } from '../ui/CoverageMetricRow';
import { CopyCoverageGapsButton } from '../ui/CopyCoverageGapsButton';
import {
  buildFileGapsScope,
  buildProjectGapsScope,
  collectFileMethods,
  collectPackageFiles,
  collectProjectFiles,
  filterCoverageFiles,
  filterCoverageMethods,
  shouldFlattenPackages,
  sortCoverageFiles,
  sortCoverageMethods,
  fileBasename,
  type CoverageFileRow,
  type CoverageFileSortBy,
  type CoverageMethodRow,
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

function CoverageMethodList({
  methods,
  search,
  sortBy,
  onSearchChange,
  onSortChange,
  idPrefix,
}: {
  methods: CoverageMethodRow[];
  search: string;
  sortBy: CoverageFileSortBy;
  onSearchChange: (value: string) => void;
  onSortChange: (value: CoverageFileSortBy) => void;
  idPrefix: string;
}) {
  const filtered = useMemo(
    () => sortCoverageMethods(filterCoverageMethods(methods, search), sortBy),
    [methods, search, sortBy],
  );

  if (methods.length === 0) {
    return <p className="coverage-project-loading muted">No method breakdown available.</p>;
  }

  return (
    <div className="coverage-method-list">
      <div className="coverage-file-toolbar tests-toolbar-row">
        <input
          type="search"
          className="search-input"
          placeholder="Filter methods…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={`Filter methods for ${idPrefix}`}
        />
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as CoverageFileSortBy)}
          aria-label={`Sort methods for ${idPrefix}`}
        >
          {FILE_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <p className="muted coverage-file-count">{filtered.length} method{filtered.length === 1 ? '' : 's'}</p>
      <ul className="coverage-method-rows">
        {filtered.map((method) => (
          <li key={`${idPrefix}::${method.label}`} className="coverage-method-row">
            <CoverageMetricRow
              label={method.label}
              title={method.title}
              value={method.metrics.line}
              compact
            />
            {method.metrics.branch !== undefined && (
              <span className="coverage-file-branch muted">{method.metrics.branch.toFixed(1)}% branches</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoverageFileList({
  files,
  project,
  pkgFilter,
  search,
  sortBy,
  onSearchChange,
  onSortChange,
  idPrefix,
  expandedFiles,
  onFileToggle,
  methodState,
  updateMethodState,
}: {
  files: CoverageFileRow[];
  project: CompactCoverageProject;
  pkgFilter?: NonNullable<CompactCoverageProject['packages']>[number];
  search: string;
  sortBy: CoverageFileSortBy;
  onSearchChange: (value: string) => void;
  onSortChange: (value: CoverageFileSortBy) => void;
  idPrefix: string;
  expandedFiles: Set<string>;
  onFileToggle: (fileKey: string, open: boolean) => void;
  methodState: Record<string, ProjectFileState>;
  updateMethodState: (key: string, patch: Partial<ProjectFileState>) => void;
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
        {filtered.map((file) => {
          const fileKey = `${idPrefix}::${file.path}`;
          const isOpen = expandedFiles.has(fileKey);
          const methods = collectFileMethods(file.path, project, pkgFilter);
          const mState = methodState[fileKey] ?? { search: '', sortBy: 'line-asc' as CoverageFileSortBy };
          const fileScope = buildFileGapsScope(file, project, pkgFilter);

          return (
            <li key={file.path} className="coverage-file-row">
              <details
                className="coverage-file-item"
                open={isOpen}
                onToggle={(e) => {
                  onFileToggle(fileKey, (e.target as HTMLDetailsElement).open);
                }}
              >
                <summary className="coverage-file-summary">
                  <CoverageMetricRow
                    label={fileBasename(file.path)}
                    title={file.path}
                    value={file.metrics.line}
                    compact
                  />
                  {file.metrics.branch !== undefined && (
                    <span className="coverage-file-branch muted">{file.metrics.branch.toFixed(1)}% branches</span>
                  )}
                  <CopyCoverageGapsButton scope={fileScope} />
                </summary>
                {isOpen && (
                  <CoverageMethodList
                    methods={methods}
                    search={mState.search}
                    sortBy={mState.sortBy}
                    onSearchChange={(search) => updateMethodState(fileKey, { search })}
                    onSortChange={(sortBy) => updateMethodState(fileKey, { sortBy })}
                    idPrefix={fileKey}
                  />
                )}
              </details>
            </li>
          );
        })}
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
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fileState, setFileState] = useState<Record<string, ProjectFileState>>({});
  const [methodState, setMethodState] = useState<Record<string, ProjectFileState>>({});

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

  const getFileState = (key: string): ProjectFileState => (
    fileState[key] ?? { search: '', sortBy: 'line-asc' }
  );

  const updateFileState = (key: string, patch: Partial<ProjectFileState>) => {
    setFileState((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { search: '', sortBy: 'line-asc' }), ...patch },
    }));
  };

  const updateMethodState = (key: string, patch: Partial<ProjectFileState>) => {
    setMethodState((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { search: '', sortBy: 'line-asc' }), ...patch },
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

  const toggleFile = (fileKey: string, open: boolean) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (open) next.add(fileKey);
      else next.delete(fileKey);
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
              const projectScope = detailProj
                ? buildProjectGapsScope(detailProj, detail)
                : buildProjectGapsScope({ name: project.name, metrics: project.metrics }, detail);

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
                    {detailProj && <CopyCoverageGapsButton scope={projectScope} />}
                  </summary>

                  {isOpen && detailLoading && !detail && (
                    <p className="coverage-project-loading muted">Loading project details…</p>
                  )}

                  {isOpen && detail && flattened && detailProj && (
                    <CoverageFileList
                      idPrefix={project.name}
                      files={collectProjectFiles(detailProj, detail)}
                      project={detailProj}
                      search={state.search}
                      sortBy={state.sortBy}
                      onSearchChange={(search) => updateFileState(project.name, { search })}
                      onSortChange={(sortBy) => updateFileState(project.name, { sortBy })}
                      expandedFiles={expandedFiles}
                      onFileToggle={toggleFile}
                      methodState={methodState}
                      updateMethodState={updateMethodState}
                    />
                  )}

                  {isOpen && detail && !flattened && packages && packages.length > 0 && (
                    <div className="coverage-project-details">
                      {packages.map((pkg) => {
                        const pkgKey = `${project.name}::${pkg.name}`;
                        const pkgOpen = expandedPackages.has(pkgKey);
                        const pkgState = getFileState(pkgKey);
                        const pkgFiles = collectPackageFiles(pkg, detail);
                        const pkgScope = detailProj
                          ? buildProjectGapsScope(detailProj, detail, pkg)
                          : buildProjectGapsScope({ name: project.name, metrics: project.metrics, packages: [pkg] }, detail, pkg);

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
                              {detailProj && <CopyCoverageGapsButton scope={pkgScope} />}
                            </summary>
                            {pkgOpen && detailProj && (
                              <CoverageFileList
                                idPrefix={pkgKey}
                                files={pkgFiles}
                                project={detailProj}
                                pkgFilter={pkg}
                                search={pkgState.search}
                                sortBy={pkgState.sortBy}
                                onSearchChange={(search) => updateFileState(pkgKey, { search })}
                                onSortChange={(sortBy) => updateFileState(pkgKey, { sortBy })}
                                expandedFiles={expandedFiles}
                                onFileToggle={toggleFile}
                                methodState={methodState}
                                updateMethodState={updateMethodState}
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
