import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { notificationsState, setupNotifications } from '../utils/restNotification'

const ASKED_KEY = 'fitflow-notif-asked'

export default function NotificationPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let asked = false
    try {
      asked = localStorage.getItem(ASKED_KEY) === '1'
    } catch {
      // sem armazenamento, sem problema
    }
    if (asked) return
    void notificationsState().then((state) => {
      if (state === 'prompt') setShow(true)
    })
  }, [])

  if (!show) return null

  function answer(allow: boolean) {
    try {
      localStorage.setItem(ASKED_KEY, '1')
    } catch {
      // sem armazenamento, sem problema
    }
    setShow(false)
    if (allow) void setupNotifications()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="sheet-enter w-full max-w-sm rounded-3xl border border-slate-600 bg-slate-800 p-6 text-center shadow-2xl">
        <div className="mb-3 text-5xl">🔔</div>
        <h2 className="mb-2 text-xl font-bold">Avisar quando o descanso acabar?</h2>
        <p className="mb-5 text-sm text-slate-300">
          O FitFlow envia uma notificação no fim do descanso, mesmo com a tela apagada. Na próxima
          janela, toque em <b>Permitir</b>.
        </p>
        <button
          onClick={() => answer(true)}
          className="mb-2 w-full rounded-xl bg-emerald-500 py-3 text-base font-bold text-slate-900"
        >
          Permitir avisos
        </button>
        <button
          onClick={() => answer(false)}
          className="w-full rounded-xl bg-slate-700 py-3 text-base font-semibold text-slate-200"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}