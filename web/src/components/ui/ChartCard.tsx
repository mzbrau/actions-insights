interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
  trend?: boolean;
}

export function ChartCard({ title, children, compact = false, trend = false }: ChartCardProps) {
  const classes = [
    'chart-card',
    compact ? 'chart-card-compact' : '',
    trend ? 'chart-card-trend' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <h3>{title}</h3>
      <div className="chart-wrap">{children}</div>
    </div>
  );
}
