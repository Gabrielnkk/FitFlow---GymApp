import type { Session } from '../types'
import { isWorkingSet } from '../utils/sets'

export interface ExercisePoint {
  date: number
  label: string // data curta para o eixo do gráfico, ex.: "26/10"
  maxWeight: number
  volume: number
  maxSeconds: number
  totalSeconds: number
}

export interface ExerciseRecords {
  maxWeight: number
  maxWeightDate: number | null
  bestReps: number // mais reps em uma série
  bestRepsWeight: number // com qual peso
  bestVolume: number // maior volume em um único treino
  bestSeconds: number // maior tempo em uma série
}

export interface ExerciseSummary {
  exerciseId: string
  name: string
  isTime: boolean
  sessions: number
  records: ExerciseRecords
}

function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Pontos do gráfico: um por treino em que o exercício aparece (sem aquecimento)
export function buildPoints(finished: Session[], exerciseId: string): ExercisePoint[] {
  return finished
    .filter((s) =>
      s.exercises.some((e) => e.exerciseId === exerciseId && e.sets.some(isWorkingSet)),
    )
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((s) => {
      const ex = s.exercises.find((e) => e.exerciseId === exerciseId)!
      const work = ex.sets.filter(isWorkingSet)
      return {
        date: s.startedAt,
        label: shortDate(s.startedAt),
        maxWeight: work.reduce((m, st) => Math.max(m, st.weight), 0),
        volume: work.reduce((sum, st) => sum + st.weight * st.reps, 0),
        maxSeconds: work.reduce((m, st) => Math.max(m, st.seconds ?? 0), 0),
        totalSeconds: work.reduce((sum, st) => sum + (st.seconds ?? 0), 0),
      }
    })
}

export function buildRecords(finished: Session[], exerciseId: string): ExerciseRecords {
  const rec: ExerciseRecords = {
    maxWeight: 0,
    maxWeightDate: null,
    bestReps: 0,
    bestRepsWeight: 0,
    bestVolume: 0,
    bestSeconds: 0,
  }
  for (const s of finished) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId)
    if (!ex) continue
    let volume = 0
    for (const st of ex.sets.filter(isWorkingSet)) {
      volume += st.weight * st.reps
      if (st.weight > rec.maxWeight) {
        rec.maxWeight = st.weight
        rec.maxWeightDate = s.startedAt
      }
      if (st.reps > rec.bestReps || (st.reps === rec.bestReps && st.weight > rec.bestRepsWeight)) {
        rec.bestReps = st.reps
        rec.bestRepsWeight = st.weight
      }
      if ((st.seconds ?? 0) > rec.bestSeconds) rec.bestSeconds = st.seconds ?? 0
    }
    if (volume > rec.bestVolume) rec.bestVolume = volume
  }
  return rec
}

// Resumo de todos os exercícios que já aparecem no histórico
export function buildSummaries(finished: Session[]): ExerciseSummary[] {
  const names = new Map<string, string>()
  const modes = new Map<string, boolean>()
  // do mais antigo para o mais novo, assim o nome mais recente vence
  for (const s of [...finished].sort((a, b) => a.startedAt - b.startedAt)) {
    for (const e of s.exercises) {
      names.set(e.exerciseId, e.exerciseName)
      modes.set(e.exerciseId, e.mode === 'time')
    }
  }
  return [...names.entries()]
    .map(([exerciseId, name]) => ({
      exerciseId,
      name,
      isTime: modes.get(exerciseId) ?? false,
      sessions: finished.filter((s) => s.exercises.some((e) => e.exerciseId === exerciseId)).length,
      records: buildRecords(finished, exerciseId),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}