import type { Session } from '../types'
import { epley1RM } from './rpe'

export interface ExerciseRecord {
  maxWeight: number
  best1RM: number
}

/** Melhores marcas de cada exercício nos treinos já finalizados (sem aquecimento nem cardio). */
export function buildRecords(finished: Session[]): Map<string, ExerciseRecord> {
  const map = new Map<string, ExerciseRecord>()
  for (const s of finished) {
    for (const ex of s.exercises) {
      if (ex.mode === 'time' || ex.cardio) continue
      for (const st of ex.sets) {
        if (!st.done || st.kind === 'warmup' || st.weight <= 0 || st.reps <= 0) continue
        const cur = map.get(ex.exerciseId) ?? { maxWeight: 0, best1RM: 0 }
        cur.maxWeight = Math.max(cur.maxWeight, st.weight)
        cur.best1RM = Math.max(cur.best1RM, epley1RM(st.weight, st.reps))
        map.set(ex.exerciseId, cur)
      }
    }
  }
  return map
}

export interface PrInfo {
  exerciseName: string
  weight: number
  reps: number
  oneRm: number
  kind: 'weight' | '1rm'
}

/** Diz se a série bate o recorde. Sem histórico anterior não comemora (é a primeira vez). */
export function checkPr(
  rec: ExerciseRecord | undefined,
  weight: number,
  reps: number,
): { weight: boolean; oneRm: number; isPr: boolean } {
  const oneRm = epley1RM(weight, reps)
  if (!rec) return { weight: false, oneRm, isPr: false }
  const heavier = weight > rec.maxWeight + 0.001
  const stronger = oneRm > rec.best1RM + 0.1
  return { weight: heavier, oneRm, isPr: heavier || stronger }
}