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
              <th>Status</th>
              <th>Test</th>
              <th>Class</th>
              <th>Duration</th>
              <th>Pass rate</th>
              <th>Links</th>
              <th className="text-right">History</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}
