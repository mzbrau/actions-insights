interface StatCardProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'passed' | 'failed';
  compact?: boolean;
}

export function StatCard({ label, value, variant = 'default', compact = false }: StatCardProps) {
  return (
    <div className={`stat-card${variant !== 'default' ? ` ${variant}` : ''}${compact ? ' stat-card-compact' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
