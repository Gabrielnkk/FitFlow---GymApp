import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fontsource-variable/plus-jakarta-sans'
import App from './App.tsx'
import { applyTheme } from './utils/theme'


applyTheme()


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,

)


