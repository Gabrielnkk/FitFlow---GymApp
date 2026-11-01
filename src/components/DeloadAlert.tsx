import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { analyzeDeload, isDeloadSnoozed, snoozeDeload } from '../utils/deload'

export default function DeloadAlert() {
  const finished = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray())
  const [hidden, setHidden] = useState(isDeloadSnoozed)

  if (hidden || !finished) return null
  const signal = analyzeDeload(finished)
  if (!signal) return null

  function dismiss(days: number) {
    snoozeDeload(days)
    setHidden(true)
  }

  return (
    <section className="mb-4 rounded-xl border border-amber-400/40 bg-slate-800 p-4">
      <div className="mb-1 text-lg font-bold text-amber-300">😮‍💨 Que tal uma semana leve?</div>
      <ul className="mb-2 list-disc pl-5 text-sm text-slate-300">
        {signal.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mb-3 text-sm text-slate-400">
        Uma semana de deload ajuda o corpo a recuperar: faça o mesmo treino com cerca de 50% das
        séries e 10 a 20% menos carga. Depois você volta mais forte.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => dismiss(28)}
          className="rounded-lg bg-emerald-500 py-3 text-sm font-bold text-white"
        >
          Vou fazer
        </button>
        <button
          onClick={() => dismiss(7)}
          className="rounded-lg bg-slate-700 py-3 text-sm font-semibold"
        >
          Lembrar depois
        </button>
      </div>
    </section>
  )
}