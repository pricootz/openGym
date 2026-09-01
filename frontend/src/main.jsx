import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { MOBILE } from './lib/mobile.js'
import './index.css'
import './redesign.css'
import './redesign-components.css'
import './zen-v2.css'
import './zen-v2-polish.css'
import './workout-v2.css'
import './plan-v2.css'
import './routine-edit-v2.css'
import './stats-v2.css'
import './library-v2.css'

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)

// Not in the mobile build: the native shell already serves everything from disk.
if (!MOBILE && 'serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {})
}
