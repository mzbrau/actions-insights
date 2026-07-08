import { DonutChart } from '../charts/DonutChart';

interface OutcomeDonutStatProps {
  passed: number;
  failed: number;
  skipped: number;
  inconclusive?: number;
}

export function OutcomeDonutStat({ passed, failed, skipped, inconclusive = 0 }: OutcomeDonutStatProps) {
  return (
    <div className="stat-card stat-card-chart">
      <div className="stat-label">Distribution</div>
      <div className="stat-chart-wrap">
        <DonutChart passed={passed} failed={failed} skipped={skipped} inconclusive={inconclusive} size={72} />
      </div>
    </div>
  );
}
