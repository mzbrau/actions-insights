import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadConfig, loadRepositoriesIndex } from '../data/loader';
import { AppShell } from '../components/layout/AppShell';

export function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [index, config] = await Promise.all([loadRepositoriesIndex(), loadConfig()]);
        if (cancelled) return;

        if (index.repositories.length === 1) {
          navigate(`/r/${index.repositories[0].key}`, { replace: true });
          return;
        }

        if (config.defaultRepository) {
          const key = config.defaultRepository.replace('/', '.');
          if (index.repositories.some((r) => r.key === key)) {
            navigate(`/r/${key}`, { replace: true });
            return;
          }
        }

        if (index.repositories.length > 0) {
          navigate(`/r/${index.repositories[0].key}`, { replace: true });
        }
      } catch {
        if (!cancelled) navigate('/', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <AppShell>
      <p className="muted">Loading…</p>
    </AppShell>
  );
}
