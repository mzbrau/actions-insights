interface PassRateRingProps {
  passRate: number;
  size?: number;
  /** When true, ring expands to fill its container */
  fill?: boolean;
}

export function PassRateRing({ passRate, size = 128, fill = false }: PassRateRingProps) {
  const dim = size;
  const cx = dim / 2;
  const cy = dim / 2;
  const r = dim * 0.4;
  const strokeWidth = dim * 0.1;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (passRate / 100) * circumference;
  const color = passRate >= 90 ? 'var(--success)' : passRate >= 70 ? 'var(--warning)' : 'var(--error)';

  return (
    <div
      className={`pass-rate-ring${fill ? ' pass-rate-ring-fill' : ''}`}
      style={fill ? undefined : { width: size, height: size }}
    >
      <svg
        width={fill ? '100%' : size}
        height={fill ? '100%' : size}
        viewBox={`0 0 ${dim} ${dim}`}
        role="img"
        aria-label={`Pass rate ${passRate}%`}
      >
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
