import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { setsPerMuscle, WEEK_MS, weekStartOf } from '../db/volume'
import ProgressTabs from '../components/ProgressTabs'

const MIN_GOOD = 10
const MAX_GOOD = 20
const SCALE_MAX = 24 // a barra "cheia" representa 24 séries

function formatWeek(start: number): string {
  const end = start + WEEK_MS - 1
  const f = (t: number) =>
    new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${f(start)} a ${f(end)}`
}

function status(sets: number): { label: string; color: string } {
  if (sets === 0) return { label: 'sem treino', color: 'text-slate-500' }
  if (sets < MIN_GOOD) return { label: 'pouco', color: 'text-amber-300' }
  if (sets <= MAX_GOOD) return { label: 'ideal', color: 'text-emerald-400' }
  return { label: 'muito', color: 'text-red-400' }
}

export default function VolumePage() {
  const finished = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray())
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const [offset, setOffset] = useState(0) // 0 = esta semana, -1 = semana passada...

  if (!finished || !exercises) return <div className="p-4 text-slate-400">Carregando...</div>

  const start = weekStartOf(Date.now()) + offset * WEEK_MS
  const data = setsPerMuscle(finished, exercises, start)
  const total = data.reduce((sum, v) => sum + v.sets, 0)

  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl font-bold">Progresso</h1>
      <ProgressTabs />

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setOffset(offset - 1)}
          className="rounded-lg bg-slate-700 px-4 py-2 text-lg"
          aria-label="Semana anterior"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="font-semibold">{offset === 0 ? 'Esta semana' : formatWeek(start)}</div>
          <div className="text-sm text-slate-400">
            {offset === 0 ? formatWeek(start) : ''} {total} séries no total
          </div>
        </div>
        <button
          onClick={() => setOffset(offset + 1)}
          disabled={offset >= 0}
          className="rounded-lg bg-slate-700 px-4 py-2 text-lg disabled:opacity-30"
          aria-label="Próxima semana"
        >
          ›
        </button>
      </div>

      <section className="rounded-xl bg-slate-800 p-4">
        <h2 className="mb-1 text-lg font-bold">Séries por músculo</h2>
        <p className="mb-4 text-sm text-slate-400">
          Para ganhar massa, o ideal costuma ser entre {MIN_GOOD} e {MAX_GOOD} séries por músculo
          por semana. Aquecimento não conta.
        </p>

        <ul className="space-y-3">
          {data.map((v) => {
            const st = status(v.sets)
            const pct = Math.min(100, (v.sets / SCALE_MAX) * 100)
            return (
              <li key={v.group}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="font-semibold">{v.group}</span>
                  <span className="text-sm">
                    <span className="font-bold">{v.sets}</span>{' '}
                    <span className={st.color}>{st.label}</span>
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-slate-900">
                  {/* faixa ideal */}
                  <div
                    className="absolute inset-y-0 bg-emerald-400/15"
                    style={{
                      left: `${(MIN_GOOD / SCALE_MAX) * 100}%`,
                      width: `${((MAX_GOOD - MIN_GOOD) / SCALE_MAX) * 100}%`,
                    }}
                  />
                  <div
                    className="relative h-full rounded-full bg-emerald-500"
                    style={{ width: `${pct}%`, transition: 'width 0.5s ease-out' }}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        {total === 0 && (
          <p className="mt-4 text-center text-sm text-slate-400">
            Nenhum treino finalizado nesta semana.
          </p>
        )}
      </section>
    </div>
  )
}