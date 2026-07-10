interface StatCardProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'passed' | 'failed';
  compact?: boolean;
  hint?: string | null;
  hintClass?: string;
}

export function StatCard({ label, value, variant = 'default', compact = false, hint, hintClass }: StatCardProps) {
  return (
    <div className={`stat-card${variant !== 'default' ? ` ${variant}` : ''}${compact ? ' stat-card-compact' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className={`stat-hint ${hintClass ?? ''}`.trim()}>{hint}</div>}
    </div>
  );
}
