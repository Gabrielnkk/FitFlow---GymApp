import type { Session } from '../types'
import { dateKey, type FoodEntry, type Macros } from '../db/nutrition'
import { WEEK_MS, weekStartOf } from '../db/volume'
import { epley1RM } from './rpe'

export interface Stats {
  sessions: number
  sets: number
  volume: number
  prs: number
  trainingDays: number
  weeksOnGoal: number
  bestWeekStreak: number
  dietDays: number // dias dentro da meta de calorias
  dietLogDays: number // dias com algum alimento registrado
  cardioSets: number
  baseXp: number
  prBySession: Map<string, number>
  setsBySession: Map<string, number>
  volumeBySession: Map<string, number>
}

/** Calcula tudo do personagem a partir do histórico. Nada é guardado: o resultado é sempre recalculado. */
export function computeStats(
  finished: Session[],
  entries: FoodEntry[],
  goal: Macros | null,
  weeklyGoal: number,
): Stats {
  const sorted = [...finished].sort(
    (a, b) => (a.finishedAt ?? a.startedAt) - (b.finishedAt ?? b.startedAt),
  )
  const best = new Map<string, { w: number; o: number }>()
  const prBySession = new Map<string, number>()
  const setsBySession = new Map<string, number>()
  const volumeBySession = new Map<string, number>()
  const weekDays = new Map<number, Set<string>>()
  const allDays = new Set<string>()
  let sets = 0
  let volume = 0
  let prs = 0
  let cardioSets = 0
  let sessions = 0
  let xp = 0

  for (const s of sorted) {
    let sSets = 0
    let sVol = 0
    let sPrs = 0
    for (const ex of s.exercises) {
      const prior = best.get(ex.exerciseId)
      let exBest = prior ? { ...prior } : { w: 0, o: 0 }
      let exPr = false
      for (const st of ex.sets) {
        if (!st.done || st.kind === 'warmup') continue
        sSets++
        if (ex.cardio) {
          cardioSets++
          continue
        }
        if (ex.mode === 'time') continue
        if (st.weight <= 0 || st.reps <= 0) continue
        sVol += st.weight * st.reps
        const o = epley1RM(st.weight, st.reps)
        if (prior && (st.weight > prior.w + 0.001 || o > prior.o + 0.1)) exPr = true
        exBest = { w: Math.max(exBest.w, st.weight), o: Math.max(exBest.o, o) }
      }
      if (exBest.w > 0) best.set(ex.exerciseId, exBest)
      if (exPr) sPrs++
    }
    prBySession.set(s.id, sPrs)
    setsBySession.set(s.id, sSets)
    volumeBySession.set(s.id, sVol)
    if (sSets === 0) continue

    sessions++
    sets += sSets
    volume += sVol
    prs += sPrs
    xp += 40 + Math.min(sSets, 30) * 6 + Math.min(Math.floor(sVol / 1000) * 4, 40) + Math.min(sPrs, 5) * 40

    const t = s.finishedAt ?? s.startedAt
    const key = dateKey(new Date(t))
    allDays.add(key)
    const wk = weekStartOf(t)
    const set = weekDays.get(wk) ?? new Set<string>()
    set.add(key)
    weekDays.set(wk, set)
  }

  // Semanas em que a meta de dias foi batida (e sequências de semanas seguidas)
  const metWeeks = [...weekDays.entries()]
    .filter(([, days]) => days.size >= weeklyGoal)
    .map(([wk]) => wk)
    .sort((a, b) => a - b)
  let prev: number | null = null
  let run = 0
  let bestWeekStreak = 0
  for (const wk of metWeeks) {
    run = prev !== null && Math.round((wk - prev) / WEEK_MS) === 1 ? run + 1 : 0
    xp += 100 + 25 * Math.min(run, 4)
    bestWeekStreak = Math.max(bestWeekStreak, run + 1)
    prev = wk
  }

  // Dieta: dia registrado vale XP; dia dentro da meta de calorias vale mais
  const byDate = new Map<string, number>()
  for (const e of entries) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.kcal)
  let dietDays = 0
  for (const [, kcal] of byDate) {
    xp += 10
    if (goal && kcal >= goal.kcal * 0.9 && kcal <= goal.kcal * 1.1) {
      dietDays++
      xp += 20
    }
  }

  return {
    sessions,
    sets,
    volume,
    prs,
    trainingDays: allDays.size,
    weeksOnGoal: metWeeks.length,
    bestWeekStreak,
    dietDays,
    dietLogDays: byDate.size,
    cardioSets,
    baseXp: xp,
    prBySession,
    setsBySession,
    volumeBySession,
  }
}