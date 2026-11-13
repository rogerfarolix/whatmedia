// Must run first: the browser may fire beforeinstallprompt before React mounts.
import './utils/installPrompt';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { startUpdateWatcher } from './utils/appUpdate';

startUpdateWatcher();

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
