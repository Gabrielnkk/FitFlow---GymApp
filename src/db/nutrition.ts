import Dexie, { type Table } from 'dexie'
import type { DietRecommendation } from '../assistant/diet'
import type { Sex } from '../utils/profile'

export type Meal = 'cafe' | 'almoco' | 'lanche' | 'jantar'

export const MEALS: { id: Meal; label: string }[] = [
  { id: 'cafe', label: 'Café da manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche', label: 'Lanche' },
  { id: 'jantar', label: 'Jantar' },
]

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface FoodEntry extends Macros {
  id?: number
  date: string // 'AAAA-MM-DD'
  meal: Meal
  name: string
  createdAt: number
}

export interface SavedDietPlan {
  id?: number
  createdAt: number
  recommendation: DietRecommendation
}

// Banco separado do resto do app: não mexe nos seus treinos
class NutritionDB extends Dexie {
  entries!: Table<FoodEntry, number>
  savedPlans!: Table<SavedDietPlan, number>

  constructor() {
    super('fitflow-nutrition')
    this.version(1).stores({ entries: '++id, date' })
    this.version(2).stores({ entries: '++id, date', savedPlans: '++id, createdAt' })
  }
}

export const nutritionDb = new NutritionDB()

// ---------- Datas ----------
export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = keyToDate(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

/** Sugere a refeição pelo horário atual. */
export function guessMeal(): Meal {
  const h = new Date().getHours()
  if (h < 10) return 'cafe'
  if (h < 15) return 'almoco'
  if (h < 18) return 'lanche'
  return 'jantar'
}

// ---------- Meta diária ----------
const GOAL_KEY = 'fitflow-nutrition-goal'

export function getGoal(): Macros | null {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(GOAL_KEY) ?? 'null')
    if (raw && typeof raw === 'object') {
      const g = raw as Macros
      if (typeof g.kcal === 'number' && g.kcal > 0) return g
    }
  } catch {
    // sem meta salva
  }
  return null
}

export function saveGoal(goal: Macros): void {
  try {
    localStorage.setItem(GOAL_KEY, JSON.stringify(goal))
  } catch {
    // sem armazenamento, sem problema
  }
}

export type Activity = 'sedentario' | 'leve' | 'moderado' | 'intenso'
export type Objective = 'perder' | 'manter' | 'ganhar'

export const ACTIVITY: { id: Activity; label: string; factor: number }[] = [
  { id: 'sedentario', label: 'Quase não treino', factor: 1.2 },
  { id: 'leve', label: 'Treino 1 a 3x por semana', factor: 1.375 },
  { id: 'moderado', label: 'Treino 4 a 5x por semana', factor: 1.55 },
  { id: 'intenso', label: 'Treino pesado todo dia', factor: 1.725 },
]

export const OBJECTIVES: { id: Objective; label: string; delta: number }[] = [
  { id: 'perder', label: 'Perder gordura', delta: -450 },
  { id: 'manter', label: 'Manter o peso', delta: 0 },
  { id: 'ganhar', label: 'Ganhar massa', delta: 300 },
]

/** Estimativa pela fórmula de Mifflin-St Jeor. É um ponto de partida, não uma regra. */
export function calcGoal(p: {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: Activity
  objective: Objective
}): Macros {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'm' ? 5 : -161)
  const factor = ACTIVITY.find((a) => a.id === p.activity)?.factor ?? 1.375
  const delta = OBJECTIVES.find((o) => o.id === p.objective)?.delta ?? 0
  const kcal = Math.max(1200, Math.round((bmr * factor + delta) / 10) * 10)
  const protein = Math.round(p.weightKg * 2)
  const fat = Math.round(p.weightKg * 0.8)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { kcal, protein, carbs, fat }
}

export function sumMacros(entries: Macros[]): Macros {
  return entries.reduce(
    (t, e) => ({
      kcal: t.kcal + e.kcal,
      protein: t.protein + e.protein,
      carbs: t.carbs + e.carbs,
      fat: t.fat + e.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
}