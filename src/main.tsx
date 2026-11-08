// made by: Gabriel Mattos
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fontsource-variable/plus-jakarta-sans'
import App from './App.tsx'
import { applyTheme } from './utils/theme'
import './glass.css'
import { registerPwa } from './pwa'

applyTheme()
registerPwa()

// Pede ao navegador para não apagar os dados do app sozinho quando faltar espaço.
// Se ele recusar, nada muda (o backup continua sendo a garantia).
void navigator.storage?.persist?.().catch(() => false)


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,

)

