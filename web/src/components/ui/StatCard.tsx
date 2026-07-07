interface StatCardProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'passed' | 'failed';
}

export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  return (
    <div className={`stat-card${variant !== 'default' ? ` ${variant}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
