import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Synchronously restore last visited route before app mounts
try {
  const stored = window.localStorage.getItem('lastPath');
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (stored && stored !== current && !current.startsWith('/login')) {
    window.history.replaceState(null, '', stored);
  }
} catch (e) {
  // ignore storage errors
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
