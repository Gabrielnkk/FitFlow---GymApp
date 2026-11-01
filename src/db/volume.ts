import type { Exercise, MuscleGroup, Session } from '../types'

const DAY = 24 * 60 * 60 * 1000

/** Início (domingo, 00:00) da semana que contém o instante t. */
export function weekStartOf(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}

export const WEEK_MS = 7 * DAY

export const VOLUME_GROUPS: MuscleGroup[] = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Pernas',
  'Glúteos',
  'Abdômen',
  'Panturrilha',
  'Outro',
]

export interface MuscleVolume {
  group: MuscleGroup
  sets: number
}

/** Séries de trabalho (feitas, sem aquecimento) por grupo muscular na semana que começa em weekStart. */
export function setsPerMuscle(
  finished: Session[],
  exercises: Exercise[],
  weekStart: number,
): MuscleVolume[] {
  const groupOf = new Map(exercises.map((e) => [e.id, e.muscleGroup]))
  const totals = new Map<MuscleGroup, number>()
  for (const s of finished) {
    const t = s.finishedAt ?? s.startedAt
    if (t < weekStart || t >= weekStart + WEEK_MS) continue
    for (const ex of s.exercises) {
      if (ex.cardio) continue
      const group = groupOf.get(ex.exerciseId) ?? 'Outro'
      if (group === 'Cardio') continue
      const n = ex.sets.filter((st) => st.done && st.kind !== 'warmup').length
      if (n > 0) totals.set(group, (totals.get(group) ?? 0) + n)
    }
  }
  return VOLUME_GROUPS.map((group) => ({ group, sets: totals.get(group) ?? 0 })).filter(
    (v) => v.sets > 0 || v.group !== 'Outro',
  )
}