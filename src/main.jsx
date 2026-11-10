import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { setupAutoUpdate } from './lib/updates.js'
import { resetScrollAfterKeyboard } from './lib/viewport.js'
import '@fontsource/homemade-apple/latin-400.css'
import './index.css'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

setupAutoUpdate()
resetScrollAfterKeyboard()
