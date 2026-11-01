import type { Session } from '../types'
import { epley1RM } from './rpe'

const KEY = 'fitflow-deload-snooze'
const DAY = 24 * 60 * 60 * 1000

export interface DeloadSignal {
  reasons: string[]
}

function weekStart(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}

/** Quantas semanas seguidas (com 2+ treinos) você está treinando, contando até agora. */
function consecutiveWeeks(finished: Session[]): number {
  const perWeek = new Map<number, number>()
  for (const s of finished) {
    const w = weekStart(s.finishedAt ?? s.startedAt)
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1)
  }
  let cursor = weekStart(Date.now())
  // a semana atual ainda pode estar no começo: não deixa ela quebrar a sequência
  if ((perWeek.get(cursor) ?? 0) < 2) cursor -= 7 * DAY
  let count = 0
  while ((perWeek.get(cursor) ?? 0) >= 2) {
    count++
    cursor -= 7 * DAY
  }
  return count
}

/** Exercícios cujo melhor 1RM dos últimos 3 treinos ficou abaixo do que você já fazia. */
function decliningExercises(finished: Session[]): number {
  const ordered = [...finished].sort(
    (a, b) => (a.finishedAt ?? a.startedAt) - (b.finishedAt ?? b.startedAt),
  )
  const series = new Map<string, number[]>()
  for (const s of ordered) {
    for (const ex of s.exercises) {
      if (ex.mode === 'time' || ex.cardio) continue
      let best = 0
      for (const st of ex.sets) {
        if (!st.done || st.kind === 'warmup' || st.weight <= 0 || st.reps <= 0) continue
        best = Math.max(best, epley1RM(st.weight, st.reps))
      }
      if (best > 0) series.set(ex.exerciseId, [...(series.get(ex.exerciseId) ?? []), best])
    }
  }
  let count = 0
  for (const values of series.values()) {
    if (values.length < 5) continue
    const prevMax = Math.max(...values.slice(0, -3))
    if (values.slice(-3).every((v) => v < prevMax * 0.97)) count++
  }
  return count
}

export function analyzeDeload(finished: Session[]): DeloadSignal | null {
  if (finished.length < 8) return null
  const reasons: string[] = []
  const weeks = consecutiveWeeks(finished)
  if (weeks >= 6) reasons.push(`${weeks} semanas seguidas treinando sem uma semana leve.`)
  const down = decliningExercises(finished)
  if (down >= 2) reasons.push(`${down} exercícios com a força abaixo do seu melhor nos últimos 3 treinos.`)
  return reasons.length > 0 ? { reasons } : null
}

export function isDeloadSnoozed(): boolean {
  try {
    return Date.now() < Number(localStorage.getItem(KEY) ?? 0)
  } catch {
    return false
  }
}

export function snoozeDeload(days: number): void {
  try {
    localStorage.setItem(KEY, String(Date.now() + days * DAY))
  } catch {
    // sem problema
  }
}