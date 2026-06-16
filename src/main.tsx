import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { FlowProvider } from './context/FlowContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter keeps deep links (e.g. /memory/:id) working when the demo
        is served as static files without server-side routing. */}
    <HashRouter>
      <FlowProvider>
        <App />
      </FlowProvider>
    </HashRouter>
  </StrictMode>,
);
