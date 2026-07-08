import type { ReactNode } from 'react';

interface TestsTableProps {
  visibleCount: number;
  children: ReactNode;
}

export function TestsTable({ visibleCount, children }: TestsTableProps) {
  return (
    <section className="tests-table-section">
      <div className="tests-table-header">
        <span className="muted small">
          {visibleCount} test{visibleCount === 1 ? '' : 's'} visible
        </span>
      </div>
      <div className="tests-table-wrap">
        <table className="data-table tests-table">
          <thead>
            <tr>
              <th className="tests-col-status">Status</th>
              <th className="tests-col-name">Test</th>
              <th className="tests-col-class">Class</th>
              <th className="tests-col-duration">Duration</th>
              <th className="tests-col-passrate">Pass rate</th>
              <th className="tests-col-links">Links</th>
              <th className="tests-col-history text-right">History</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}
