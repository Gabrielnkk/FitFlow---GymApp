import type { Session, SessionExercise, SessionSet } from '../types'
import { formatKg } from '../utils/format'
import { formatRpe } from '../utils/rpe'
import { isWorkingSet } from '../utils/sets'

const FLAG = 'fitflow-auto-progression'

export function isAutoProgressionOn(): boolean {
  try {
    return localStorage.getItem(FLAG) !== 'off'
  } catch {
    return true
  }
}

export function setAutoProgression(on: boolean): void {
  try {
    localStorage.setItem(FLAG, on ? 'on' : 'off')
  } catch {
    // sem armazenamento, sem problema
  }
}

export interface Suggestion {
  action: 'up' | 'hold' | 'down'
  weight: number // carga sugerida (maior série)
  last: number // carga da última vez (maior série)
  seconds?: number // meta de tempo sugerida (só exercícios de tempo)
  reason: string
}

function weightStep(weight: number): number {
  if (weight < 20) return 1
  if (weight < 100) return 2.5
  return 5
}

// Séries que valem para avaliar: sem aquecimento e sem drop set
function evalSets(ex: SessionExercise): SessionSet[] {
  const working = ex.sets.filter(isWorkingSet)
  const main = working.filter((s) => s.kind !== 'drop')
  return main.length > 0 ? main : working
}

function metGoal(ex: SessionExercise): boolean {
  const sets = evalSets(ex)
  if (sets.length === 0) return false
  if (ex.mode === 'time') {
    const target = ex.targetSeconds ?? 0
    return sets.every((s) => (s.seconds ?? 0) >= target)
  }
  return sets.every((s) => s.reps >= ex.targetReps)
}

function avgRpe(ex: SessionExercise): number | null {
  const values = evalSets(ex)
    .map((s) => s.rpe)
    .filter((x): x is number => x !== undefined)
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
}

function topWeight(ex: SessionExercise): number {
  return evalSets(ex).reduce((m, s) => Math.max(m, s.weight), 0)
}

export function suggestProgression(finished: Session[], exerciseId: string): Suggestion | null {
  const history = finished
    .filter((s) => s.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => b.startedAt - a.startedAt)

  const entries: SessionExercise[] = []
  for (const s of history) {
    const e = s.exercises.find((x) => x.exerciseId === exerciseId)
    if (e && evalSets(e).length > 0) entries.push(e)
  }
  if (entries.length === 0) return null

  const last = entries[0]
  const top = topWeight(last)
  const rpe = avgRpe(last)
  const met = metGoal(last)
  const rpeText = rpe === null ? '' : ` (RPE médio ${formatRpe(Math.round(rpe * 2) / 2)})`
  const calm = rpe === null || rpe < 9.5

  // Exercícios de tempo
  if (last.mode === 'time') {
    const target = last.targetSeconds ?? 30
    const step = target >= 120 ? 30 : 5
    if (met && calm) {
      return {
        action: 'up',
        weight: top,
        last: top,
        seconds: target + step,
        reason: `Completou ${target}s em todas as séries${rpeText}. Meta de hoje: ${target + step}s.`,
      }
    }
    return {
      action: 'hold',
      weight: top,
      last: top,
      seconds: target,
      reason: met
        ? `Completou, mas o esforço foi muito alto${rpeText}. Repita ${target}s.`
        : `Não completou ${target}s em todas as séries. Repita a meta.`,
    }
  }

  // Exercícios de repetições
  if (met && calm) {
    if (top === 0) {
      return {
        action: 'hold',
        weight: 0,
        last: 0,
        reason: `Bateu ${last.targetReps} reps sem carga. Tente mais repetições ou adicione peso.`,
      }
    }
    const next = top + weightStep(top)
    return {
      action: 'up',
      weight: next,
      last: top,
      reason: `Bateu ${last.targetReps} reps em todas as séries${rpeText}. Subindo de ${formatKg(top)} para ${formatKg(next)} kg.`,
    }
  }

  if (met) {
    return {
      action: 'hold',
      weight: top,
      last: top,
      reason: `Bateu a meta, mas o esforço foi muito alto${rpeText}. Repita ${formatKg(top)} kg.`,
    }
  }

  // Duas sessões seguidas sem bater a meta com a mesma carga: reduz ~5%
  const previous = entries[1]
  if (previous && !metGoal(previous) && top > 0 && Math.abs(topWeight(previous) - top) < 0.01) {
    const step = weightStep(top)
    const lower = Math.max(0, Math.round((top * 0.95) / step) * step)
    if (lower < top) {
      return {
        action: 'down',
        weight: lower,
        last: top,
        reason: `Duas sessões sem bater a meta com ${formatKg(top)} kg. Reduzindo para ${formatKg(lower)} kg para voltar forte.`,
      }
    }
  }

  return {
    action: 'hold',
    weight: top,
    last: top,
    reason: `Não bateu ${last.targetReps} reps em todas as séries. Mantenha ${formatKg(top)} kg.`,
  }
}