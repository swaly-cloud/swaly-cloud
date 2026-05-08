import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(err => {
    console.warn('Service Worker registration failed:', err);
  });
}

// Prevent standalone mode from opening in browser
if (window.navigator.standalone === false) {
  console.log('Running in browser mode');
} else if (window.navigator.standalone === true) {
  console.log('Running in standalone PWA mode');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
