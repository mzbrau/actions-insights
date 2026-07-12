import { useState } from 'react';
import type { CoverageGapsScope } from '../../utils/coverageDisplay';
import { CoverageGapsDialog } from './CoverageGapsDialog';

interface CopyCoverageGapsButtonProps {
  scope: CoverageGapsScope;
  label?: string;
}

export function CopyCoverageGapsButton({ scope, label = 'Copy gaps' }: CopyCoverageGapsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="coverage-copy-gaps-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title={`${label} — copy coverage gaps below threshold`}
      >
        {label}
      </button>
      {open && (
        <CoverageGapsDialog
          scope={scope}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
