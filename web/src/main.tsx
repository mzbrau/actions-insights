import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { clearDataCache } from './data/loader';
import { ThemeProvider } from './theme/ThemeProvider';
import './styles/global.css';

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    clearDataCache();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
);
