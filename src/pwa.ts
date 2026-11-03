import { Capacitor } from '@capacitor/core'

/** Liga o modo offline da versão web (iPhone/navegador). No app Android não faz nada. */
export function registerPwa(): void {
  if (Capacitor.isNativePlatform() || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // sem service worker (ex.: modo dev): o app segue normal
    })
  })
}