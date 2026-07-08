interface PassRateRingProps {
  passRate: number;
  size?: number;
}

export function PassRateRing({ passRate, size = 128 }: PassRateRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const strokeWidth = size * 0.1;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (passRate / 100) * circumference;
  const color = passRate >= 90 ? 'var(--success)' : passRate >= 70 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="pass-rate-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Pass rate ${passRate}%`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--surface-container)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="pass-rate-ring-label">
        <span className="pass-rate-value">{passRate}%</span>
      </div>
    </div>
  );
}
