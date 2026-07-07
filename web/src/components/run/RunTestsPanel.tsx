import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CompactTestRecord } from '@actions-insights/history-models';
import { FilterChips } from '../ui/FilterChips';
import { formatDuration, outcomeIcon } from '../../utils/format';

type TestFilter = 'all' | 'failed' | 'passed' | 'skipped';

interface RunTestsPanelProps {
  tests: CompactTestRecord[];
  totalCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  filter: TestFilter;
  onFilterChange: (value: TestFilter) => void;
}

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'failed' as const, label: 'Failed', variant: 'failed' as const },
  { value: 'passed' as const, label: 'Passed', variant: 'passed' as const },
  { value: 'skipped' as const, label: 'Skipped', variant: 'skipped' as const },
];

export function RunTestsPanel({
  tests,
  totalCount,
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: RunTestsPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tests.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <div className="tab-panel" role="tabpanel">
      <h2 className="section-title">All Tests ({totalCount})</h2>
      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Search tests…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search tests"
        />
        <FilterChips options={FILTER_OPTIONS} value={filter} onChange={onFilterChange} ariaLabel="Filter tests" />
      </div>

      {tests.length === 0 ? (
        <p className="empty-state">No tests match your filters.</p>
      ) : (
        <div className="virtual-list" ref={listRef}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((item) => {
              const test = tests[item.index];
              return (
                <div
                  key={test.n}
                  className="test-row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: item.size,
                    transform: `translateY(${item.start}px)`,
                  }}
                >
                  <span>{outcomeIcon(test.o)}</span>
                  <span className="test-name">{test.n}</span>
                  <span className="muted">{formatDuration(test.d)}</span>
                  {test.nf && <span className="badge">new</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
