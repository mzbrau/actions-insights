interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}

export function ChartCard({ title, children, compact = false }: ChartCardProps) {
  return (
    <div className={`chart-card${compact ? ' chart-card-compact' : ''}`}>
      <h3>{title}</h3>
      <div className="chart-wrap">{children}</div>
    </div>
  );
}
