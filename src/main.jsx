import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Register service worker. With autoUpdate + skipWaiting + clientsClaim, the
// new SW activates immediately in the background. We fire a custom event so
// the app can show the "update ready" banner without coupling SW logic into
// React state directly.
registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event('pwa-update-available'))
  },
  onOfflineReady() {
    // App is fully cached for offline use — no UI needed
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
