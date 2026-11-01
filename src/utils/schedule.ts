import type { Session, Workout } from '../types'

// Dias da semana como no JavaScript: 0 = domingo ... 6 = sábado
export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const WEEKDAYS_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
// Ordem em que os dias aparecem na escolha (a semana começa na segunda)
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const KEY = 'fitflow-workout-days'

export type DaysMap = Record<string, number[]>

export function getAllDays(): DaysMap {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && typeof raw === 'object') return raw as DaysMap
  } catch {
    // sem dados salvos
  }
  return {}
}

export function setDays(workoutId: string, days: number[]): void {
  try {
    const all = getAllDays()
    if (days.length === 0) delete all[workoutId]
    else all[workoutId] = [...days].sort((a, b) => a - b)
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // sem armazenamento, sem problema
  }
}

function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function dayAt(todayStart: number, offset: number): Date {
  const d = new Date(todayStart)
  d.setDate(d.getDate() + offset)
  return d
}

export interface PlanResult {
  /** true se pelo menos um treino tem dias escolhidos */
  scheduled: boolean
  /** o próximo treino marcado (hoje, se ainda não foi feito, ou o próximo dia com treino) */
  next?: { workout: Workout; label: string }
  /** o treino marcado para um dia desta semana que passou sem ser feito */
  missed?: { workout: Workout; label: string }
}

export function planNext(
  list: Workout[],
  finished: Session[],
  now: number,
  daysMap: DaysMap,
): PlanResult {
  const daysOf = (w: Workout) => daysMap[w.id] ?? []
  if (!list.some((w) => daysOf(w).length > 0)) return { scheduled: false }

  const today = startOfDay(now)
  const doneAt = (w: Workout, dayStart: number) =>
    finished.some(
      (s) => s.workoutId === w.id && startOfDay(s.finishedAt ?? s.startedAt) === dayStart,
    )

  const result: PlanResult = { scheduled: true }

  // Hoje e os próximos dias
  for (let k = 0; k <= 7; k++) {
    const d = dayAt(today, k)
    const dayStart = d.getTime()
    const candidates = list.filter(
      (w) => daysOf(w).includes(d.getDay()) && (k > 0 || !doneAt(w, dayStart)),
    )
    if (candidates.length > 0) {
      const label = k === 0 ? 'hoje' : k === 1 ? 'amanhã' : WEEKDAYS_LONG[d.getDay()]
      result.next = { workout: candidates[0], label }
      break
    }
  }

  // Treino marcado para um dia anterior desta semana que ficou sem fazer
  const weekStart = dayAt(today, -new Date(today).getDay()).getTime()
  for (let k = 1; k <= 6; k++) {
    const d = dayAt(today, -k)
    const dayStart = d.getTime()
    if (dayStart < weekStart) break
    const pending = list.find(
      (w) =>
        daysOf(w).includes(d.getDay()) &&
        !finished.some(
          (s) => s.workoutId === w.id && startOfDay(s.finishedAt ?? s.startedAt) >= dayStart,
        ),
    )
    if (pending) {
      result.missed = { workout: pending, label: k === 1 ? 'ontem' : WEEKDAYS_LONG[d.getDay()] }
      break
    }
  }

  return result
}