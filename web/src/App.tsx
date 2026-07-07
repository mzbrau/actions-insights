import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { RepositoryPage } from './pages/RepositoryPage';
import { BranchPage } from './pages/BranchPage';
import { RunDetailPage } from './pages/RunDetailPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/r/:repoKey" element={<RepositoryPage />} />
      <Route path="/r/:repoKey/b/:branchKey" element={<BranchPage />} />
      <Route path="/r/:repoKey/b/:branchKey/run/:runId" element={<RunDetailPage />} />
      <Route path="*" element={<Layout><p>Page not found</p></Layout>} />
    </Routes>
  );
}
