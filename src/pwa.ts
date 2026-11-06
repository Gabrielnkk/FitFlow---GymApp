// made by: Gabriel Mattos
import { Capacitor } from '@capacitor/core'

/** Liga o modo offline da versão web (iPhone/navegador). No app Android não faz nada. */
export function registerPwa(): void {
  if (Capacitor.isNativePlatform() || !('serviceWorker' in navigator)) return
  // No dev (npm run dev) o arquivo sw.js não existe: o Vite devolveria o index.html no lugar e o
  // navegador reclamaria do tipo "text/html". Então não registra e ainda limpa restos de testes antigos.
  if (import.meta.env.DEV) {
    navigator.serviceWorker
      .getRegistrations()
      .then((list) => list.forEach((r) => void r.unregister()))
      .catch(() => {})
    return
  }
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // sem service worker (ex.: modo dev): o app segue normal
    })
  })
}