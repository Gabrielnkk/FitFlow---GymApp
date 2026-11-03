import { useState } from 'react'
import { Capacitor } from '@capacitor/core'

const KEY = 'fitflow-ios-hint-dismissed'

function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Aviso que ensina a instalar o app no iPhone. Só aparece no Safari do iPhone, nunca no APK. */
export default function InstallHint() {
  const [open, setOpen] = useState(
    () => !Capacitor.isNativePlatform() && isIos() && !isInstalled() && !wasDismissed(),
  )
  if (!open) return null

  function close() {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // sem armazenamento: o aviso volta na próxima vez
    }
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-x-0 z-40 px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
    >
      <div className="mx-auto max-w-md rounded-2xl border border-white/15 bg-slate-800 p-4 shadow-2xl">
        <div className="mb-1 text-base font-bold text-white">Instale o FitFlow no iPhone</div>
        <p className="mb-3 text-sm leading-relaxed text-slate-300">
          Toque em <span className="font-bold">Compartilhar</span> (o quadrado com a seta para cima, na barra do
          Safari) e depois em <span className="font-bold">Adicionar à Tela de Início</span>. Assim ele abre em tela
          cheia e funciona offline.
        </p>
        <button onClick={close} className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-bold text-white">
          Entendi
        </button>
      </div>
    </div>
  )
}