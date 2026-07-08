import type { BranchIndexEntry } from '@actions-insights/history-models';

interface BranchFilterBarProps {
  branches: BranchIndexEntry[];
  selectedBranch: string;
  onBranchChange: (branchKey: string) => void;
  lastUpdated?: string;
}

export function BranchFilterBar({
  branches,
  selectedBranch,
  onBranchChange,
  lastUpdated,
}: BranchFilterBarProps) {
  const quickBranches = branches
    .slice()
    .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
    .slice(0, 5);

  return (
    <div className="branch-filter-bar">
      <div className="branch-filter-left">
        <select
          className="branch-select"
          value={selectedBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          aria-label="Filter by branch"
        >
          <option value="">Showing all branches</option>
          {branches.map((b) => (
            <option key={b.key} value={b.key}>
              {b.label}
            </option>
          ))}
        </select>
        <span className="branch-filter-sep" aria-hidden="true">|</span>
        <div className="branch-quick-chips">
          <button
            type="button"
            className={`branch-chip${selectedBranch === '' ? ' active' : ''}`}
            onClick={() => onBranchChange('')}
          >
            All
          </button>
          {quickBranches.map((b) => (
            <button
              key={b.key}
              type="button"
              className={`branch-chip${selectedBranch === b.key ? ' active' : ''}${b.type === 'pr' ? ' pr' : ''}`}
              onClick={() => onBranchChange(b.key)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      {lastUpdated && (
        <div className="branch-filter-meta muted small">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
