// made by: Gabriel Mattos
import type { Session, SessionExercise } from '../types'
import { formatKg } from './format'
import { isWorkingSet } from './sets'

/** Para cada exercício, o que você fez na última vez (séries de trabalho, sem aquecimento). */
export function buildLastTime(finished: Session[]): Map<string, SessionExercise> {
  const out = new Map<string, SessionExercise>()
  const newestFirst = [...finished].sort((a, b) => b.startedAt - a.startedAt)
  for (const s of newestFirst) {
    for (const ex of s.exercises) {
      if (out.has(ex.exerciseId)) continue
      const sets = ex.sets.filter((st) => isWorkingSet(st) && st.done)
      if (sets.length > 0) out.set(ex.exerciseId, { ...ex, sets })
    }
  }
  return out
}

const MAX_SHOWN = 6

/** Ex.: "50×10 · 50×8 · 45×8" (ou "40 s · 35 s" nos exercícios por tempo). */
export function formatLastTime(ex: SessionExercise): string {
  const parts = ex.sets.slice(0, MAX_SHOWN).map((st) => {
    if (ex.mode === 'time') return `${st.seconds ?? 0} s`
    return st.weight > 0 ? `${formatKg(st.weight)}×${st.reps}` : `${st.reps} reps`
  })
  const extra = ex.sets.length - MAX_SHOWN
  return parts.join(' · ') + (extra > 0 ? ` · +${extra}` : '')
}
