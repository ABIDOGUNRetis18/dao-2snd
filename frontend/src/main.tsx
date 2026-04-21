import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'  // Nouvelle structure CSS organisée
import './config/fetchProxy'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
