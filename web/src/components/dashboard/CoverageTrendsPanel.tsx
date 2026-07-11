import { useNavigate } from 'react-router-dom';
import type { EnrichedRun } from '../../utils/repositoryRuns';
import { CoverageTrendChart, collectProjectNames, runsToCoveragePoints } from '../charts/CoverageTrendChart';
import { ChartCard } from '../ui/ChartCard';

interface CoverageTrendsPanelProps {
  repoKey: string;
  runs: EnrichedRun[];
}

export function CoverageTrendsPanel({ repoKey, runs }: CoverageTrendsPanelProps) {
  const navigate = useNavigate();
  const coverageRuns = runs.filter((r) => r.coverage?.line !== undefined);
  const projectNames = collectProjectNames(coverageRuns);

  const onRunClick = (runId: string) => {
    const run = coverageRuns.find((r) => r.runId === runId);
    if (run) {
      navigate(`/r/${repoKey}/b/${encodeURIComponent(run.branchKey)}/run/${runId}?tab=coverage`);
    }
  };

  if (coverageRuns.length === 0) {
    return (
      <div className="tab-panel" role="tabpanel">
        <p className="chart-empty">No coverage data available for this repository yet.</p>
      </div>
    );
  }

  return (
    <div className="tab-panel" role="tabpanel">
      <ChartCard title="Application Coverage (Line %)" trend>
        <CoverageTrendChart
          points={runsToCoveragePoints(coverageRuns)}
          onBarClick={onRunClick}
        />
      </ChartCard>

      {projectNames.map((projectName) => (
        <ChartCard key={projectName} title={`${projectName} — Line Coverage`} trend>
          <CoverageTrendChart
            points={runsToCoveragePoints(coverageRuns, projectName)}
            onBarClick={onRunClick}
          />
        </ChartCard>
      ))}
    </div>
  );
}
