import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/space-grotesk'
import App from './app/App.jsx'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
