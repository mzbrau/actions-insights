import { useNavigate } from 'react-router-dom';
import type { BranchIndexEntry } from '@actions-insights/history-models';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { BranchFilterBar } from './BranchFilterBar';
import { RunTrendsChart } from '../charts/RunTrendsChart';
import { ChartCard } from '../ui/ChartCard';

interface TrendsPanelProps {
  repoKey: string;
  runs: EnrichedRun[];
  singleBranchView: boolean;
  branches: BranchIndexEntry[];
  selectedBranch: string;
  onBranchChange: (branchKey: string) => void;
  lastUpdated?: string;
}

export function TrendsPanel({
  repoKey,
  runs,
  singleBranchView,
  branches,
  selectedBranch,
  onBranchChange,
  lastUpdated,
}: TrendsPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="tab-panel trends-panel" role="tabpanel">
      <BranchFilterBar
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={onBranchChange}
        lastUpdated={lastUpdated}
      />

      <div className="trends-charts">
        <ChartCard title="Test runs over time">
          <RunTrendsChart
            runs={runs}
            singleBranchView={singleBranchView}
            onRunClick={(run) => {
              navigate(`/r/${repoKey}/b/${encodeURIComponent(run.branchKey)}/run/${run.runId}`);
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
}
