import { useMemo, useState } from 'react';
import type { CoverageRunRecord } from '@actions-insights/history-models';
import { CoverageProgressBar } from '../ui/CoverageProgressBar';
import { ChartCard } from '../ui/ChartCard';

interface RunCoveragePanelProps {
  coverage: CoverageRunRecord;
}

export function RunCoveragePanel({ coverage }: RunCoveragePanelProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(
    coverage.projects[0]?.name ?? null,
  );
  const [fileSearch, setFileSearch] = useState('');

  const files = useMemo(() => {
    if (!coverage.files || !coverage.paths) return [];
    return coverage.files.map((f) => ({
      path: coverage.paths![f.p] ?? `#${f.p}`,
      metrics: f.metrics,
    }));
  }, [coverage.files, coverage.paths]);

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, fileSearch]);

  return (
    <div className="tab-panel run-coverage-panel" role="tabpanel">
      <div className="stats-grid coverage-summary-grid">
        <CoverageProgressBar label="Line" value={coverage.summary.line} variant="line" />
        <CoverageProgressBar label="Branch" value={coverage.summary.branch} variant="branch" />
      </div>

      <section className="section">
        <h2 className="section-title">Projects</h2>
        <div className="coverage-project-list">
          {coverage.projects.map((project) => (
            <details
              key={project.name}
              className="coverage-project-item"
              open={expandedProject === project.name}
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  setExpandedProject(project.name);
                }
              }}
            >
              <summary className="coverage-project-summary">
                <span>{project.name}</span>
                <span className="coverage-project-metrics">
                  {project.metrics.line !== undefined ? `${project.metrics.line.toFixed(1)}% lines` : '—'}
                  {project.metrics.branch !== undefined ? ` · ${project.metrics.branch.toFixed(1)}% branches` : ''}
                </span>
              </summary>
              {(project.packages ?? []).map((pkg) => (
                <div key={pkg.name} className="coverage-package-block">
                  <h3 className="coverage-package-title">{pkg.name}</h3>
                  <ul className="coverage-class-list">
                    {(pkg.classes ?? []).map((cls) => (
                      <li key={`${pkg.name}-${cls.name}`}>
                        <span>{cls.name}</span>
                        <span className="muted">
                          {cls.metrics.line !== undefined ? `${cls.metrics.line.toFixed(1)}%` : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          ))}
        </div>
      </section>

      {files.length > 0 && (
        <section className="section">
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
        </section>
      )}
    </div>
  );
}
