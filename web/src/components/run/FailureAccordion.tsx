import type { FailureRecord } from '@actions-insights/history-models';

interface FailureAccordionProps {
  failures: FailureRecord[];
  expanded: Set<string>;
  onToggle: (fullName: string) => void;
}

function groupByClass(failures: FailureRecord[]): Map<string, FailureRecord[]> {
  const groups = new Map<string, FailureRecord[]>();
  for (const f of failures) {
    const dot = f.fullName.lastIndexOf('.');
    const className = dot >= 0 ? f.fullName.slice(0, dot) : 'Other';
    const list = groups.get(className) ?? [];
    list.push(f);
    groups.set(className, list);
  }
  return groups;
}

export function FailureAccordion({ failures, expanded, onToggle }: FailureAccordionProps) {
  const groups = groupByClass(failures);

  return (
    <>
      {[...groups.entries()].map(([className, items]) => (
        <div key={className} className="failure-group">
          <div className="failure-group-title">{className}</div>
          {items.map((f) => {
            const isOpen = expanded.has(f.fullName);
            return (
              <article key={f.fullName} className="failure-item">
                <button
                  type="button"
                  className="failure-header"
                  aria-expanded={isOpen}
                  onClick={() => onToggle(f.fullName)}
                >
                  <div>
                    <div className="failure-name">❌ {f.fullName}</div>
                    {f.message && !isOpen && (
                      <div className="failure-message">{f.message.split('\n')[0]}</div>
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="failure-body">
                    {f.message && <pre className="code-block">{f.message}</pre>}
                    {f.stackTrace && <pre className="code-block">{f.stackTrace}</pre>}
                    {f.stdout && (
                      <details>
                        <summary>stdout</summary>
                        <pre className="code-block">{f.stdout}</pre>
                      </details>
                    )}
                    {f.stderr && (
                      <details>
                        <summary>stderr</summary>
                        <pre className="code-block">{f.stderr}</pre>
                      </details>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ))}
    </>
  );
}
