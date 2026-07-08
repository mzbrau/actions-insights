import { useState, type ReactNode } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { SidebarTree } from './SidebarTree';

interface AppShellProps {
  children: ReactNode;
  topBar?: ReactNode;
}

export function AppShell({ children, topBar }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoFile = theme === 'dark' ? 'logo-white.png' : 'logo-black.png';
  const logoSrc = `${import.meta.env.BASE_URL}${logoFile}`;

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img
              src={logoSrc}
              alt=""
              className="sidebar-brand-logo"
            />
            <span className="sidebar-brand-text">Actions Insights</span>
          </div>
          <button
            type="button"
            className="btn sidebar-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <SidebarTree onNavigate={() => setSidebarOpen(false)} />

        <div className="sidebar-footer">
          <span><kbd>/</kbd> search</span>
          <span><kbd>g</kbd> <kbd>r</kbd> repos</span>
        </div>
      </aside>

      <div className="main-canvas">
        <div className="canvas-toolbar">
          <button
            type="button"
            className="btn sidebar-toggle"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          {topBar}
        </div>
        <main className="canvas-content">{children}</main>
      </div>
    </div>
  );
}
