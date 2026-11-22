import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { setupAutoUpdate } from './lib/updates.js'
import { resetScrollAfterKeyboard } from './lib/viewport.js'
import { storage } from './lib/storage.js'
import { repoOf } from './lib/url.js'
import '@fontsource/homemade-apple/latin-400.css'
import './index.css'
import './App.css'

// A link naming a repo (a share link) opens this tab in it; other tabs stay in theirs
storage.startTab(repoOf(window.location.search))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

setupAutoUpdate()
resetScrollAfterKeyboard()
