import { useMemo, useState } from 'react';
import type {
  CompactCoverageProject,
  CoverageMetrics,
  CoverageRunRecord,
  CoverageSummaryCompact,
} from '@actions-insights/history-models';
import { CoverageProgressBar } from '../ui/CoverageProgressBar';
import { ChartCard } from '../ui/ChartCard';
import { formatCoverageDisplayName } from '../../utils/format';

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
}

export function RunCoveragePanel({
  summary,
  detail,
  detailLoading,
  onRequestDetail,
}: RunCoveragePanelProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [showFiles, setShowFiles] = useState(false);
  const [fileSearch, setFileSearch] = useState('');

  const projects = useMemo((): ProjectRow[] => {
    if (detail?.projects?.length) {
      return detail.projects.map((project) => ({
        name: project.name,
        metrics: project.metrics,
        packages: project.packages,
      }));
    }
    if (summary.projects) {
      return Object.entries(summary.projects)
        .map(([name, metrics]) => ({ name, metrics }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }, [summary.projects, detail?.projects]);

  const files = useMemo(() => {
    if (!detail?.files || !detail.paths) return [];
    return detail.files.map((f) => ({
      path: detail.paths![f.p] ?? `#${f.p}`,
      metrics: f.metrics,
    }));
  }, [detail?.files, detail?.paths]);

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, fileSearch]);

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
      <div className="stats-grid coverage-summary-grid">
        <CoverageProgressBar label="Line" value={summary.line} variant="line" />
        <CoverageProgressBar label="Branch" value={summary.branch} variant="branch" />
      </div>

      <section className="section">
        <h2 className="section-title">Projects</h2>
        {projects.length === 0 ? (
          <p className="muted">No project-level coverage breakdown available.</p>
        ) : (
          <div className="coverage-project-list">
            {projects.map((project) => {
              const packages = detailProject(project.name)?.packages ?? project.packages;
              const isOpen = expandedProject === project.name;

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
                    <span>{project.name}</span>
                    <span className="coverage-project-metrics">
                      {project.metrics.line !== undefined ? `${project.metrics.line.toFixed(1)}% lines` : '—'}
                      {project.metrics.branch !== undefined ? ` · ${project.metrics.branch.toFixed(1)}% branches` : ''}
                    </span>
                  </summary>

                  {isOpen && detailLoading && !detail && (
                    <p className="coverage-project-loading muted">Loading project details…</p>
                  )}

                  {isOpen && detail && packages && packages.length > 0 && (
                    <div className="coverage-project-details">
                      {packages.map((pkg) => {
                        const pkgKey = `${project.name}::${pkg.name}`;
                        const pkgOpen = expandedPackages.has(pkgKey);
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
                              <span>{pkg.name}</span>
                              <span className="coverage-project-metrics">
                                {pkg.metrics.line !== undefined ? `${pkg.metrics.line.toFixed(1)}% lines` : '—'}
                              </span>
                            </summary>
                            {pkgOpen && (pkg.classes ?? []).length > 0 && (
                              <ul className="coverage-class-list">
                                {(pkg.classes ?? []).map((cls) => (
                                  <li key={`${pkg.name}-${cls.name}`}>
                                    <span title={cls.name}>{formatCoverageDisplayName(cls.name)}</span>
                                    <span className="muted">
                                      {cls.metrics.line !== undefined ? `${cls.metrics.line.toFixed(1)}%` : '—'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </details>
                        );
                      })}
                    </div>
                  )}

                  {isOpen && detail && (!packages || packages.length === 0) && !detailLoading && (
                    <p className="coverage-project-loading muted">No package breakdown for this project.</p>
                  )}
                </details>
              );
            })}
          </div>
        )}
      </section>

      {detail && files.length > 0 && (
        <section className="section">
          {!showFiles ? (
            <button
              type="button"
              className="btn coverage-files-toggle"
              onClick={() => setShowFiles(true)}
            >
              View file coverage ({files.length} files)
            </button>
          ) : (
            <ChartCard title={`Files (${filteredFiles.length})`}>
              <input
                type="search"
                className="search-input"
                placeholder="Search files…"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                aria-label="Search coverage files"
              />
              <div className="coverage-file-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Line</th>
                      <th>Branch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.slice(0, 500).map((file) => (
                      <tr key={file.path}>
                        <td className="coverage-file-path">{file.path}</td>
                        <td>{file.metrics.line !== undefined ? `${file.metrics.line.toFixed(1)}%` : '—'}</td>
                        <td>{file.metrics.branch !== undefined ? `${file.metrics.branch.toFixed(1)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredFiles.length > 500 && (
                  <p className="muted">Showing first 500 of {filteredFiles.length} files.</p>
                )}
              </div>
            </ChartCard>
          )}
        </section>
      )}
    </div>
  );
}
