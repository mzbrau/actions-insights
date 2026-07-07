interface PageHeaderProps {
  backLabel?: string;
  onBack?: () => void;
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ backLabel, onBack, title, meta, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      {backLabel && onBack && (
        <button type="button" className="link-btn" onClick={onBack}>
          ← {backLabel}
        </button>
      )}
      <h1>{title}</h1>
      {meta && <div className="page-header-meta">{meta}</div>}
      {actions && <div className="link-row">{actions}</div>}
    </div>
  );
}
