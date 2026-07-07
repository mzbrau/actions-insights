interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-wrap">{children}</div>
    </div>
  );
}
