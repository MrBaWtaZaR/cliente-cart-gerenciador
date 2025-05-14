
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { safeCleanupDOM } from './components/ShipmentSafeUnmount';

// Add global error handler for React errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Try to clean up any DOM elements that might be causing issues
  try {
    safeCleanupDOM(10); // Highest priority for error recovery
  } catch (e) {
    // Silent catch - last resort
  }
});

// Initial DOM cleanup before mounting the React app
// This helps with hot reloading and development mode
setTimeout(() => {
  try {
    safeCleanupDOM(10);
  } catch (e) {
    // Silent catch - just precautionary
  }
}, 0);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Final cleanup for any lingering elements after hydration
setTimeout(() => {
  try {
    safeCleanupDOM(5);
  } catch (e) {
    // Silent catch - just precautionary
  }
}, 300);
