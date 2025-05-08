
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { setupStorage } from './integrations/supabase/storage';

// Configure storage before rendering the application
// But don't block rendering if it fails
setupStorage().catch(error => {
  console.error('Failed to setup storage, continuing with app initialization:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
