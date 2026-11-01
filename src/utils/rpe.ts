import type { Session, SessionSet } from '../types'
import { isWorkingSet } from './sets'

// Estimativa de 1RM (carga máxima para 1 repetição) pela fórmula de Epley
export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

// Melhor 1RM estimado de cada exercício, usando só treinos finalizados
export function buildBaselines(finished: Session[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const s of finished) {
    for (const ex of s.exercises) {
      for (const st of ex.sets) {
        if (!isWorkingSet(st) || st.reps > 12) continue // aquecimento e muitas reps ficam de fora
        const value = epley1RM(st.weight, st.reps)
        if (value > (map.get(ex.exerciseId) ?? 0)) map.set(ex.exerciseId, value)
      }
    }
  }
  return map
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2
}

// RPE estimado de 5 a 10, em passos de 0,5. Retorna null se não há base.
export function estimateRpe(
  weight: number,
  reps: number,
  baseline: number | undefined,
): number | null {
  if (!baseline || weight <= 0 || reps <= 0) return null
  const oneRm = Math.max(baseline, epley1RM(weight, reps))
  const maxReps = 30 * (oneRm / weight - 1) // quantas reps você aguentaria com este peso
  const rpe = 10 - (maxReps - reps) // 10 menos as reps que sobravam
  return roundHalf(Math.min(10, Math.max(5, rpe)))
}

// RPE automático levando em conta o tipo da série
export function autoRpe(
  set: Pick<SessionSet, 'weight' | 'reps' | 'kind'>,
  baseline: number | undefined,
): number | null {
  if (set.kind === 'warmup') return null
  if (set.kind === 'failure' || set.kind === 'drop') {
    return set.weight > 0 && set.reps > 0 ? 10 : null
  }
  return estimateRpe(set.weight, set.reps, baseline)
}

// RPE automático de todas as séries de um exercício, considerando o cansaço acumulado.
// Se uma série de FALHA usa o mesmo peso de séries normais anteriores, o app entende que
// a capacidade foi caindo de série em série até a falha (o corpo já estava cansado) e
// estima o RPE das séries normais com essa queda, em vez de comparar tudo com o descansado.
export function rpeForSets(sets: SessionSet[], baseline: number | undefined): (number | null)[] {
  const result = sets.map((s) => autoRpe(s, baseline))

  sets.forEach((fail, j) => {
    if (fail.kind !== 'failure' || !fail.done || fail.weight <= 0 || fail.reps <= 0) return

    const group: number[] = []
    for (let i = 0; i < j; i++) {
      const s = sets[i]
      const normal = s.kind === undefined || s.kind === 'normal'
      if (s.done && normal && s.reps > 0 && Math.abs(s.weight - fail.weight) < 0.001) group.push(i)
    }
    if (group.length === 0) return

    const n = group.length // posição da falha dentro do grupo (0 = primeira série)
    const firstReps = sets[group[0]].reps
    const byBaseline = baseline ? 30 * (baseline / fail.weight - 1) : 0
    const fresh = Math.max(byBaseline, firstReps + (baseline ? 0 : 2), fail.reps) // reps com o corpo descansado

    group.forEach((index, k) => {
      const capacity = fresh - ((fresh - fail.reps) * k) / n // capacidade nesta série
      const rpe = 10 - (capacity - sets[index].reps)
      result[index] = roundHalf(Math.min(10, Math.max(5, rpe)))
    })
  })

  return result
}

// Carga sugerida para fazer "reps" repetições terminando no RPE escolhido
export function suggestWeight(oneRm: number, reps: number, rpe: number): number {
  const repsToFailure = reps + (10 - rpe)
  return oneRm / (1 + repsToFailure / 30)
}

// Repetições sugeridas com esta carga, terminando no RPE escolhido
export function suggestReps(oneRm: number, weight: number, rpe: number): number {
  const maxReps = 30 * (oneRm / weight - 1)
  return Math.max(1, Math.round(maxReps - (10 - rpe)))
}

// Arredonda a carga para o múltiplo de 0,5 kg mais próximo
export function roundWeight(weight: number): number {
  return Math.max(0, roundHalf(weight))
}

export function formatRpe(value: number): string {
  return String(value).replace('.', ',')
}