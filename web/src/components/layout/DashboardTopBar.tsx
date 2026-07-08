import { useNavigate } from 'react-router-dom';

interface DashboardTopBarProps {
  repoName?: string;
  search: string;
  onSearchChange: (value: string) => void;
}

export function DashboardTopBar({ repoName, search, onSearchChange }: DashboardTopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-top-bar">
      <div className="dashboard-breadcrumbs">
        <button type="button" className="link-btn" onClick={() => navigate('/')}>
          ← Repositories
        </button>
        {repoName && (
          <>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{repoName}</span>
          </>
        )}
      </div>
      <input
        type="search"
        className="search-input dashboard-search"
        placeholder="Search runs…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search runs"
      />
    </div>
  );
}
