import { dateToInput } from '../db/body'
import type { Session } from '../types'

const GOAL_KEY = 'fitflow-weekly-goal'

export function getWeeklyGoal(): number {
  try {
    const n = parseInt(localStorage.getItem(GOAL_KEY) ?? '', 10)
    return n >= 1 && n <= 7 ? n : 3
  } catch {
    return 3
  }
}

export function setWeeklyGoal(n: number): void {
  try {
    localStorage.setItem(GOAL_KEY, String(n))
  } catch {
    // sem armazenamento, sem problema
  }
}

// Conjunto dos dias (AAAA-MM-DD) em que houve treino finalizado
export function trainedDays(finished: Session[]): Set<string> {
  return new Set(finished.map((s) => dateToInput(s.startedAt)))
}

// Segunda-feira (00:00, horário local) da semana da data informada
export function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
}

export function daysTrainedInWeek(days: Set<string>, monday: Date): number {
  let n = 0
  for (let i = 0; i < 7; i++) {
    if (days.has(dateToInput(addDays(monday, i).getTime()))) n++
  }
  return n
}

// Semanas seguidas batendo a meta. A semana atual só soma se a meta já foi batida
// e nunca quebra a sequência enquanto ainda está em andamento.
export function weeklyStreak(days: Set<string>, goal: number, today = new Date()): number {
  const thisMonday = mondayOf(today)
  let streak = daysTrainedInWeek(days, thisMonday) >= goal ? 1 : 0
  for (let i = 1; i < 520; i++) {
    if (daysTrainedInWeek(days, addDays(thisMonday, -7 * i)) >= goal) streak++
    else break
  }
  return streak
}

export function bestStreak(days: Set<string>, goal: number, today = new Date()): number {
  if (days.size === 0) return 0
  const first = [...days].sort()[0]
  const [y, m, d] = first.split('-').map(Number)
  const lastMonday = mondayOf(today).getTime()
  let monday = mondayOf(new Date(y, m - 1, d))
  let best = 0
  let run = 0
  while (monday.getTime() <= lastMonday) {
    if (daysTrainedInWeek(days, monday) >= goal) {
      run++
      best = Math.max(best, run)
    } else if (monday.getTime() < lastMonday) {
      run = 0
    }
    monday = addDays(monday, 7)
  }
  return best
}