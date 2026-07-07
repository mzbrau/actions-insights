export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
  variant?: 'default' | 'passed' | 'failed' | 'skipped';
}

interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = 'Filter',
}: FilterChipsProps<T>) {
  return (
    <div className="filter-chips" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`chip${value === opt.value ? ' active' : ''}${opt.variant && value === opt.value ? ` ${opt.variant}` : ''}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
