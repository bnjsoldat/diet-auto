import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { applyInitialTheme } from './lib/theme';
import { registerServiceWorker } from './lib/pwa';
import { initSentry, logException } from './lib/sentry';
import './index.css';

applyInitialTheme();
registerServiceWorker();
// No-op si VITE_SENTRY_DSN absent (mode dev / pas encore configuré)
void initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary onError={(error, info) => logException(error, { componentStack: info.componentStack })}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
