import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

export function BranchRedirect() {
  const { repoKey, branchKey: rawBranchKey } = useParams<{ repoKey: string; branchKey: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!repoKey || !rawBranchKey) return;
    const branchKey = decodeURIComponent(rawBranchKey);
    navigate(`/r/${repoKey}?branch=${encodeURIComponent(branchKey)}`, { replace: true });
  }, [repoKey, rawBranchKey, navigate]);

  return (
    <AppShell>
      <p className="muted">Redirecting…</p>
    </AppShell>
  );
}
