
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { initializeApp } from './lib/init';

import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize app services
initializeApp().catch(console.error);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
        <Toaster richColors position="top-right" closeButton />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);
