import type { RunStatus } from '@actions-insights/history-models';

interface StatusBannerProps {
  status: RunStatus;
  title: string;
  subtitle: string;
}

export function StatusBanner({ status, title, subtitle }: StatusBannerProps) {
  return (
    <div className={`status-banner ${status}`}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
