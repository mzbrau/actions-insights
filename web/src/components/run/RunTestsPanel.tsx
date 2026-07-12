import { useMemo, useState } from 'react';
import type { CompactTestRecord, TestHistoryEntry } from '@actions-insights/history-models';
import { TestListGrouped } from './TestListGrouped';
import { TestRow } from './TestRow';
import { TestsTable } from './TestsTable';
import {
  filterTests,
  getSortedProjectNames,
  groupTestsByProjectAndClass,
  sortTests,
  type TestFilterKey,
  type TestSortBy,
} from '../../utils/testList';

interface RunTestsPanelProps {
  tests: CompactTestRecord[];
  totalCount: number;
  trends: Record<string, TestHistoryEntry> | null;
  repository: string;
  repoKey?: string;
  workflowUrl?: string;
  jobUrl?: string;
  slowThreshold?: number;
}

const FILTER_OPTIONS: { value: TestFilterKey; label: string; variant?: 'failed' | 'passed' | 'skipped' }[] = [
  { value: 'failed', label: 'Failed', variant: 'failed' },
  { value: 'passed', label: 'Passed', variant: 'passed' },
  { value: 'skipped', label: 'Skipped', variant: 'skipped' },
  { value: 'slow', label: 'Slow' },
  { value: 'new', label: 'New' },
];

const SORT_OPTIONS: { value: TestSortBy; label: string }[] = [
  { value: 'default', label: 'Default (grouped)' },
  { value: 'name', label: 'Name' },
  { value: 'duration', label: 'Duration' },
  { value: 'outcome', label: 'Outcome' },
  { value: 'passRate', label: 'Pass rate' },
];

export function RunTestsPanel({
  tests,
  totalCount,
  trends,
  repository,
  repoKey,
  workflowUrl,
  jobUrl,
  slowThreshold = 1000,
}: RunTestsPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [filters, setFilters] = useState<Set<TestFilterKey>>(new Set());
  const [sortBy, setSortBy] = useState<TestSortBy>('default');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const getPassRate = (fullName: string) => trends?.[fullName]?.passRate ?? null;

  const projectNames = useMemo(() => getSortedProjectNames(tests), [tests]);

  const filtered = useMemo(
    () => filterTests(tests, {
      search,
      filters,
      slowThreshold,
      project: selectedProject === 'all' ? undefined : selectedProject,
    }),
    [tests, search, filters, slowThreshold, selectedProject],
  );

  const sorted = useMemo(
    () => sortTests(filtered, sortBy === 'default' ? 'name' : sortBy, getPassRate),
    [filtered, sortBy, trends],
  );

  const grouped = useMemo(
    () => (sortBy === 'default' ? groupTestsByProjectAndClass(filtered) : null),
    [filtered, sortBy],
  );

  const toggleFilter = (key: TestFilterKey) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleHistory = (fullName: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  };

  return (
    <div className="tab-panel" role="tabpanel">
      <h2 className="section-title">All Tests ({totalCount})</h2>

      <div className="tests-toolbar">
        {projectNames.length > 1 && (
          <div className="tests-toolbar-row">
            <select
              className="sort-select tests-project-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project"
            >
              <option value="all">All projects</option>
              {projectNames.map((project) => (
                <option key={project} value={project}>
                  {project === '—' ? 'No project' : project}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="tests-toolbar-row">
          <input
            type="search"
            className="search-input tests-search"
            placeholder="Search tests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tests"
          />
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TestSortBy)}
            aria-label="Sort tests"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-chips tests-filter-chips" role="group" aria-label="Filter tests">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`chip${filters.has(opt.value) ? ' active' : ''}${opt.variant ? ` ${opt.variant}` : ''}`}
              onClick={() => toggleFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No tests match your filters.</p>
      ) : (
        <TestsTable shownCount={filtered.length} totalCount={tests.length}>
          {sortBy === 'default' && grouped ? (
            <TestListGrouped
              grouped={grouped}
              repository={repository}
              repoKey={repoKey}
              workflowUrl={workflowUrl}
              jobUrl={jobUrl}
              trends={trends}
              expanded={expanded}
              onToggleHistory={toggleHistory}
            />
          ) : (
            sorted.map((test) => (
              <TestRow
                key={test.n}
                test={test}
                repository={repository}
                repoKey={repoKey}
                workflowUrl={workflowUrl}
                jobUrl={jobUrl}
                trends={trends}
                expanded={expanded.has(test.n)}
                onToggleHistory={() => toggleHistory(test.n)}
              />
            ))
          )}
        </TestsTable>
      )}
    </div>
  );
}
