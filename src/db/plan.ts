import { db } from './database'
import { newId } from '../utils/id'
import type { Exercise, MuscleGroup, Workout, WorkoutExercise } from '../types'
import type { Experience } from '../utils/profile'

export type Goal = 'hipertrofia' | 'forca' | 'emagrecer'

export interface PlannedDay {
  name: string
  items: WorkoutExercise[]
}

interface DayTemplate {
  label: string
  slots: MuscleGroup[]
}

const FULL: DayTemplate = {
  label: 'Corpo todo',
  slots: ['Pernas', 'Peito', 'Costas', 'Ombros', 'Tríceps', 'Bíceps', 'Abdômen'],
}
const UPPER: DayTemplate = {
  label: 'Superior',
  slots: ['Peito', 'Costas', 'Ombros', 'Peito', 'Costas', 'Bíceps', 'Tríceps'],
}
const LOWER: DayTemplate = {
  label: 'Inferior',
  slots: ['Pernas', 'Pernas', 'Glúteos', 'Pernas', 'Panturrilha', 'Abdômen'],
}
const PUSH: DayTemplate = {
  label: 'Empurrar',
  slots: ['Peito', 'Peito', 'Ombros', 'Ombros', 'Tríceps', 'Tríceps'],
}
const PULL: DayTemplate = {
  label: 'Puxar',
  slots: ['Costas', 'Costas', 'Costas', 'Bíceps', 'Bíceps', 'Abdômen'],
}
const LEGS: DayTemplate = { label: 'Pernas', slots: LOWER.slots }

export const WEEKDAYS: Record<number, string[]> = {
  2: ['Seg', 'Qui'],
  3: ['Seg', 'Qua', 'Sex'],
  4: ['Seg', 'Ter', 'Qui', 'Sex'],
  5: ['Seg', 'Ter', 'Qua', 'Sex', 'Sáb'],
  6: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
}

function splitFor(days: number, experience: Experience): DayTemplate[] {
  switch (days) {
    case 2:
      return [FULL, FULL]
    case 3:
      return experience === 'avancado' ? [PUSH, PULL, LEGS] : [FULL, FULL, FULL]
    case 4:
      return [UPPER, LOWER, UPPER, LOWER]
    case 5:
      return [PUSH, PULL, LEGS, UPPER, LOWER]
    default:
      return [PUSH, PULL, LEGS, PUSH, PULL, LEGS]
  }
}

// Exercícios preferidos de cada grupo (os primeiros da lista são os principais)
const PREFER: Partial<Record<MuscleGroup, string[]>> = {
  Peito: ['supino reto', 'supino inclinado', 'crucifixo', 'flexão'],
  Costas: ['puxada', 'remada', 'barra fixa'],
  Ombros: ['desenvolvimento', 'elevação lateral'],
  Pernas: ['agachamento', 'leg press', 'stiff', 'extensora', 'flexora', 'afundo'],
  Glúteos: ['elevação pélvica', 'hip thrust', 'glúteo'],
  Bíceps: ['rosca direta', 'rosca martelo', 'rosca'],
  Tríceps: ['tríceps na polia', 'tríceps', 'testa'],
  Abdômen: ['abdominal', 'prancha'],
  Panturrilha: ['panturrilha'],
}

function rank(ex: Exercise, group: MuscleGroup): number {
  const name = ex.name.toLowerCase()
  const index = (PREFER[group] ?? []).findIndex((key) => name.includes(key))
  return index === -1 ? 99 : index
}

function pick(all: Exercise[], group: MuscleGroup, used: Set<string>, rotation: number): Exercise | null {
  const pool = all
    .filter((e) => e.muscleGroup === group && !used.has(e.id))
    .sort((a, b) => rank(a, group) - rank(b, group) || a.name.localeCompare(b.name))
  if (pool.length === 0) return null
  const top = pool.slice(0, Math.min(pool.length, 3))
  return top[rotation % top.length]
}

function params(experience: Experience, goal: Goal) {
  const count = experience === 'iniciante' ? 5 : experience === 'intermediario' ? 6 : 7
  const sets = experience === 'avancado' ? 4 : 3
  const baseReps = goal === 'emagrecer' ? 14 : goal === 'forca' ? 10 : experience === 'avancado' ? 8 : 10
  const rest = goal === 'emagrecer' ? 45 : goal === 'forca' ? 150 : 75
  return { count, sets, baseReps, rest }
}

export interface PlanOptions {
  days: number
  experience: Experience
  goal: Goal
}

// Monta os treinos da semana a partir da biblioteca de exercícios
export function generatePlan(all: Exercise[], options: PlanOptions): PlannedDay[] {
  const { days, experience, goal } = options
  const { count, sets, baseReps, rest } = params(experience, goal)
  const weekdays = WEEKDAYS[days] ?? WEEKDAYS[3]

  return splitFor(days, experience).map((template, dayIndex) => {
    const used = new Set<string>()
    const items: WorkoutExercise[] = []

    for (const group of template.slots.slice(0, count)) {
      const ex = pick(all, group, used, dayIndex)
      if (!ex) continue
      used.add(ex.id)
      const main = items.length < 2 // os dois primeiros são os principais
      const heavy = goal === 'forca' && main
      items.push({
        exerciseId: ex.id,
        sets,
        targetReps: heavy ? 5 : baseReps,
        restSeconds: main && goal !== 'emagrecer' ? rest + 30 : rest,
        targetSeconds: ex.mode === 'time' ? 30 : undefined,
      })
    }

    if (goal === 'emagrecer') {
      const cardio = all
        .filter((e) => e.muscleGroup === 'Cardio')
        .sort((a, b) => Number(!a.name.toLowerCase().includes('esteira')) - Number(!b.name.toLowerCase().includes('esteira')))[0]
      if (cardio) {
        items.push({
          exerciseId: cardio.id,
          sets: 1,
          targetReps: 15,
          restSeconds: 0,
          targetSeconds: cardio.mode === 'time' ? (experience === 'iniciante' ? 900 : 1200) : undefined,
        })
      }
    }

    const letter = String.fromCharCode(65 + dayIndex)
    return { name: `Treino ${letter} · ${template.label} (${weekdays[dayIndex]})`, items }
  })
}

// Salva os treinos no topo da lista de Treinos
export async function savePlan(plan: PlannedDay[]): Promise<void> {
  const existing = await db.workouts.toArray()
  const orders = existing.map((w) => w.order).filter((o): o is number => o !== undefined)
  const first = Math.min(0, ...orders) - plan.length
  const now = Date.now()
  const workouts: Workout[] = plan
    .filter((d) => d.items.length > 0)
    .map((d, i) => ({
      id: newId(),
      name: d.name,
      items: d.items,
      createdAt: now,
      updatedAt: now,
      order: first + i,
    }))
  await db.workouts.bulkAdd(workouts)
}