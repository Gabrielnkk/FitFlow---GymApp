import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'
import { startEmptySession, startWorkoutSession } from '../db/sessions'
import { moveWorkout, sortWorkouts } from '../db/workoutOrder'
import type { Workout } from '../types'
import { newId } from '../utils/id'
import BackupReminder from '../components/BackupReminder'
import DeloadAlert from '../components/DeloadAlert'
import { useMemo, useState } from 'react'
import WorkoutDays from '../components/WorkoutDays'
import { getAllDays, planNext } from '../utils/schedule'
import CharacterCard from '../components/CharacterCard'


const DAY = 24 * 60 * 60 * 1000

function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function startOfWeek(t: number): number {
  const d = new Date(startOfDay(t))
  d.setDate(d.getDate() - d.getDay()) // domingo
  return d.getTime()
}

function weeklyGoal(): number {
  try {
    const n = Number(localStorage.getItem('fitflow-weekly-goal'))
    return n >= 1 && n <= 7 ? Math.round(n) : 3
  } catch {
    return 3
  }
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Anel de progresso da semana. */
function Ring({ done, goal }: { done: number; goal: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const pct = Math.min(1, done / goal)
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(148,170,255,0.16)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold leading-none">{done}</span>
        <span className="text-[11px] text-slate-400">de {goal}</span>
      </div>
    </div>
  )
}

export default function WorkoutsPage() {
  const navigate = useNavigate()
  const workouts = useLiveQuery(() => db.workouts.toArray().then(sortWorkouts))
  const activeList = useLiveQuery(() => db.sessions.where('status').equals('active').toArray())
  const finished = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray())
  const active = activeList?.[0]
  const list = workouts ?? []
    const [daysVersion, setDaysVersion] = useState(0)
  const daysMap = useMemo(() => getAllDays(), [daysVersion])

  // ----- números do painel -----
  const goal = weeklyGoal()
  const now = Date.now()
  const weekStart = startOfWeek(now)
  const doneDays = new Set<number>()
  const allDays = new Set<number>()
  for (const s of finished ?? []) {
    const day = startOfDay(s.finishedAt ?? s.startedAt)
    allDays.add(day)
    if (day >= weekStart) doneDays.add(day)
  }
  const doneThisWeek = doneDays.size

  // sequência: dias seguidos com treino (hoje ainda pode estar vazio)
  let streak = 0
  let cursor = startOfDay(now)
  if (!allDays.has(cursor)) cursor -= DAY
  while (allDays.has(cursor)) {
    streak++
    cursor -= DAY
  }

  // próximo treino: pelos dias da semana escolhidos; sem dias, segue a ordem da lista
  let nextWorkout: Workout | undefined
  let nextLabel = 'PRÓXIMO TREINO'
  let missed: { workout: Workout; label: string } | undefined
  if (list.length > 0) {
    const plan = planNext(list, finished ?? [], now, daysMap)
    if (plan.scheduled) {
      nextWorkout = plan.next?.workout
      if (plan.next) nextLabel = `PRÓXIMO TREINO · ${plan.next.label.toUpperCase()}`
      missed = plan.missed
    } else {
      const last = [...(finished ?? [])]
        .filter((s) => s.workoutId)
        .sort((a, b) => (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt))[0]
      const idx = last ? list.findIndex((w) => w.id === last.workoutId) : -1
      nextWorkout = list[(idx + 1) % list.length]
    }
  }
  async function duplicate(w: Workout) {
    const t = Date.now()
    await db.workouts.add({
      ...w,
      id: newId(),
      name: `${w.name} (cópia)`,
      items: w.items.map((it) => ({ ...it })),
      order: w.order !== undefined ? w.order + 0.5 : undefined, // logo abaixo do original
      createdAt: t,
      updatedAt: t,
    })
  }

  async function remove(w: Workout) {
    if (window.confirm(`Excluir o treino "${w.name}"? O histórico não será apagado.`)) {
      await db.workouts.delete(w.id)
    }
  }

  async function start(w: Workout) {
    if (active) {
      window.alert('Já existe um treino em andamento. Finalize ou descarte antes de iniciar outro.')
      navigate('/sessao')
      return
    }
    await startWorkoutSession(w)
    navigate('/sessao')
  }

  async function startEmpty() {
    if (!active) await startEmptySession()
    navigate('/sessao')
  }

  return (
    <div className="p-4">
      <p className="text-sm font-medium text-slate-400">{greeting()} 👋</p>
      <h1 className="mb-4 text-3xl font-bold">Treinos</h1>

      <BackupReminder />
      <CharacterCard />
      <DeloadAlert />

      {/* Painel da semana */}
      <section className="mb-4 flex items-center gap-4 rounded-xl bg-slate-800 p-4">
        <Ring done={doneThisWeek} goal={goal} />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold">
            {doneThisWeek >= goal ? 'Meta da semana batida! 🎉' : 'Sua semana'}
          </div>
          <div className="mb-2 text-sm text-slate-400">
            {doneThisWeek >= goal
              ? 'Continue assim, você está voando.'
              : `Faltam ${goal - doneThisWeek} ${goal - doneThisWeek === 1 ? 'dia' : 'dias'} para a meta.`}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1 text-sm font-semibold">
            <span>🔥</span>
            <span>
              {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
            </span>
          </div>
        </div>
      </section>

      {/* Treino em andamento ou próximo treino */}
      {active ? (
        <button
          onClick={() => navigate('/sessao')}
          className="mb-4 w-full rounded-xl bg-emerald-500 p-4 text-left text-white active:opacity-90"
        >
          <div className="text-xs font-bold tracking-wider opacity-80">TREINO EM ANDAMENTO</div>
          <div className="text-lg font-bold">{active.name} · Continuar →</div>
        </button>
      ) : (
        nextWorkout && (
          <section className="mb-4 rounded-xl bg-slate-800 p-4">
                        <div className="text-xs font-bold tracking-wider text-emerald-400">{nextLabel}</div>
            <div className="mb-3 text-xl font-bold">{nextWorkout.name}</div>
            <button
              onClick={() => start(nextWorkout!)}
              className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white active:opacity-90"
            >
                           ▶ Começar agora
            </button>
            {missed && (
              <button
                onClick={() => start(missed!.workout)}
                className="mt-2 w-full rounded-xl py-2 text-sm text-slate-400 active:opacity-60"
              >
                Você perdeu {missed.label}: {missed.workout.name} · Fazer agora
              </button>
            )}
          </section>
        )
      )}

      {workouts && workouts.length === 0 && (
        <div className="rounded-xl bg-slate-800 p-6 text-center">
          <p className="mb-1 text-lg font-semibold">Nenhum treino ainda</p>
          <p className="text-slate-400">Toque em "+ Novo treino" para criar o primeiro.</p>
        </div>
      )}

      {list.length > 0 && (
        <h2 className="mb-2 mt-2 text-sm font-bold tracking-wider text-slate-400">SUAS ROTINAS</h2>
      )}

      <ul className="space-y-3">
        {list.map((w, index) => (
          <li key={w.id} className="rounded-xl bg-slate-800 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xl font-semibold">{w.name}</div>
                <div className="text-sm text-slate-400">
                  {w.items.length} {w.items.length === 1 ? 'exercício' : 'exercícios'}
                                  <WorkoutDays
                  id={w.id}
                  name={w.name}
                  days={daysMap[w.id] ?? []}
                  onChange={() => setDaysVersion((v) => v + 1)}
                />
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => moveWorkout(list, index, -1)}
                  disabled={index === 0}
                  className="rounded-lg bg-slate-700 px-3 py-2 disabled:opacity-30"
                  aria-label="Mover para cima"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveWorkout(list, index, 1)}
                  disabled={index === list.length - 1}
                  className="rounded-lg bg-slate-700 px-3 py-2 disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
              </div>
            </div>
            <button
              onClick={() => start(w)}
              className="mb-2 w-full rounded-lg bg-emerald-500 py-4 text-lg font-bold text-white active:opacity-90"
            >
              ▶ Iniciar treino
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => navigate(`/treinos/${w.id}`)}
                className="rounded-lg bg-slate-700 py-3 text-sm font-semibold"
              >
                Editar
              </button>
              <button
                onClick={() => duplicate(w)}
                className="rounded-lg bg-slate-700 py-3 text-sm font-semibold"
              >
                Duplicar
              </button>
              <button
                onClick={() => remove(w)}
                className="rounded-lg bg-slate-700 py-3 text-sm font-semibold text-red-400"
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!active && (
        <button
          onClick={startEmpty}
          className="mt-4 w-full rounded-xl border-2 border-dashed border-slate-600 py-4 text-lg font-semibold text-slate-300 active:bg-slate-800"
        >
          Iniciar treino avulso (sem rotina)
        </button>
      )}
       <button
        onClick={() => navigate('/treino-ia')}
        className="mt-3 w-full rounded-xl bg-slate-800 py-4 text-lg font-semibold text-emerald-400"
      >
        ✨ Gerar treino com IA
      </button>
      {/* espaço para o botão flutuante não cobrir o botão acima */}
      <div className="h-24" aria-hidden />
      <button
        onClick={() => navigate('/treinos/novo')}
        className="fixed right-4 rounded-full bg-emerald-500 px-6 py-4 text-lg font-bold text-white shadow-lg active:opacity-90"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}
      >
        + Novo treino
      </button>
    </div>
  )
}