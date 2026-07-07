import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">
            Actions Insights
          </Link>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Repositories
            </Link>
          </nav>
          <div className="header-actions">
            <button type="button" className="btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️ Theme' : '🌙 Theme'}
            </button>
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <span>Keyboard: <kbd>/</kbd> search · <kbd>g</kbd> <kbd>r</kbd> repositories</span>
      </footer>
    </div>
  );
}
