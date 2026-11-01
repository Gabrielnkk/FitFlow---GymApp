import type { Session, SessionExercise } from '../types'
import { isWorkingSet } from '../utils/sets'

export function sessionVolume(s: Session): number {
  return s.exercises.reduce(
    (total, ex) =>
      total + ex.sets.filter(isWorkingSet).reduce((sum, st) => sum + st.weight * st.reps, 0),
    0,
  )
}

export function bestWeight(ex: SessionExercise): number {
  return ex.sets.filter(isWorkingSet).reduce((max, st) => Math.max(max, st.weight), 0)
}

export function bestSeconds(ex: SessionExercise): number {
  return ex.sets.filter(isWorkingSet).reduce((max, st) => Math.max(max, st.seconds ?? 0), 0)
}

export interface PreviousInfo {
  date: number
  exercise: SessionExercise
}

// Acha, entre os treinos finalizados, o anterior a "current" que tem este exercício
export function findPrevious(
  finished: Session[],
  current: Session,
  exerciseId: string,
): PreviousInfo | null {
  const before = finished
    .filter((s) => s.id !== current.id && s.startedAt < current.startedAt)
    .sort((a, b) => b.startedAt - a.startedAt)
  for (const s of before) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId)
    if (ex) return { date: s.startedAt, exercise: ex }
  }
  return null
}