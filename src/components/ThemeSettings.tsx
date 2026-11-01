import { useState } from 'react'
import { getTheme, setTheme } from '../utils/theme'
import type { ThemeChoice } from '../utils/theme'

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'dark', label: '🌙 Escuro' },
  { value: 'light', label: '☀️ Claro' },
  { value: 'auto', label: '📱 Automático' },
]

export default function ThemeSettings() {
  const [choice, setChoice] = useState<ThemeChoice>(getTheme)

  function pick(value: ThemeChoice) {
    setChoice(value)
    setTheme(value)
  }

  return (
    <section className="mb-4 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-1 text-xl font-bold">Aparência</h2>
      <p className="mb-3 text-sm text-slate-400">
        Escolha o tema do app. No automático, ele segue o tema do seu celular.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => pick(o.value)}
            className={`rounded-xl py-3 text-sm font-bold ${
              choice === o.value ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  )
}