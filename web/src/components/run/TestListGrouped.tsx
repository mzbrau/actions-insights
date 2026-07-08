import { Fragment } from 'react';
import type { TestHistoryEntry } from '@actions-insights/history-models';
import { sortedProjectKeys } from '../../utils/testList';
import type { GroupedTests } from '../../utils/testList';
import { TestRow } from './TestRow';

const COL_SPAN = 7;

interface TestListGroupedProps {
  grouped: GroupedTests;
  repository: string;
  workflowUrl?: string;
  jobUrl?: string;
  trends: Record<string, TestHistoryEntry> | null;
  expanded: Set<string>;
  onToggleHistory: (fullName: string) => void;
}

export function TestListGrouped({
  grouped,
  repository,
  workflowUrl,
  jobUrl,
  trends,
  expanded,
  onToggleHistory,
}: TestListGroupedProps) {
  return (
    <>
      {sortedProjectKeys(grouped).map((project) => {
        const byClass = grouped.get(project)!;
        const showProjectTitle = project !== '—';

        return (
          <Fragment key={project}>
            {showProjectTitle && (
              <tr className="test-group-row">
                <td colSpan={COL_SPAN} className="project-title">{project}</td>
              </tr>
            )}
            {[...byClass.keys()].sort().map((cls) => (
              <Fragment key={cls}>
                <tr className="test-group-row">
                  <td colSpan={COL_SPAN} className="class-title">{cls}</td>
                </tr>
                {byClass.get(cls)!.map((test) => (
                  <TestRow
                    key={test.n}
                    test={test}
                    repository={repository}
                    workflowUrl={workflowUrl}
                    jobUrl={jobUrl}
                    trends={trends}
                    expanded={expanded.has(test.n)}
                    onToggleHistory={() => onToggleHistory(test.n)}
                    hideClass
                  />
                ))}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}
