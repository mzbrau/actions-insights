interface QuickStatsPanelProps {
  total: number;
  avgDuration: string;
  failRate: string;
}

export function QuickStatsPanel({ total, avgDuration, failRate }: QuickStatsPanelProps) {
  return (
    <div className="quick-stats-panel">
      <div className="quick-stats-row">
        <span className="quick-stats-label">Total</span>
        <span className="quick-stats-value">{total}</span>
      </div>
      <div className="quick-stats-row">
        <span className="quick-stats-label">Avg Duration</span>
        <span className="quick-stats-value">{avgDuration}</span>
      </div>
      <div className="quick-stats-row">
        <span className="quick-stats-label">Fail Rate</span>
        <span className="quick-stats-value failed">{failRate}</span>
      </div>
    </div>
  );
}
