import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomeRedirect } from './pages/HomeRedirect';
import { RepositoryDashboardPage } from './pages/RepositoryDashboardPage';
import { BranchRedirect } from './pages/BranchRedirect';
import { RunDetailPage } from './pages/RunDetailPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/r/:repoKey" element={<RepositoryDashboardPage />} />
      <Route path="/r/:repoKey/b/:branchKey" element={<BranchRedirect />} />
      <Route path="/r/:repoKey/b/:branchKey/run/:runId" element={<RunDetailPage />} />
      <Route path="*" element={<AppShell><p>Page not found</p></AppShell>} />
    </Routes>
  );
}
