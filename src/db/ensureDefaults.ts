import { db } from './database'
import { buildDefaultExercises } from './seed'
import { buildTimeExercises, TIME_EXERCISE_NAMES } from './timeExercises'

const FLAG_V2 = 'fitflow-default-exercises-v2'
const FLAG_TIME = 'fitflow-time-exercises-v1'

// Adiciona os exercícios padrão que faltam (uma vez só)
async function ensureV2(): Promise<void> {
  try {
    if (localStorage.getItem(FLAG_V2)) return
    await db.transaction('rw', db.exercises, async () => {
      const existing = new Set((await db.exercises.toArray()).map((e) => e.name.toLowerCase()))
      const missing = buildDefaultExercises().filter((e) => !existing.has(e.name.toLowerCase()))
      if (missing.length > 0) await db.exercises.bulkAdd(missing)
    })
    localStorage.setItem(FLAG_V2, '1')
  } catch {
    // tenta de novo na próxima abertura
  }
}

// Marca os exercícios padrão de tempo e adiciona os novos (uma vez só)
async function ensureTimeExercises(): Promise<void> {
  try {
    if (localStorage.getItem(FLAG_TIME)) return
    await db.transaction('rw', db.exercises, async () => {
      const all = await db.exercises.toArray()
      const timeNames = new Set(TIME_EXERCISE_NAMES.map((n) => n.toLowerCase()))
      for (const e of all) {
        if (e.isDefault && !e.mode && timeNames.has(e.name.toLowerCase())) {
          await db.exercises.update(e.id, { mode: 'time' })
        }
      }
      const existing = new Set(all.map((e) => e.name.toLowerCase()))
      const missing = buildTimeExercises().filter((e) => !existing.has(e.name.toLowerCase()))
      if (missing.length > 0) await db.exercises.bulkAdd(missing)
    })
    localStorage.setItem(FLAG_TIME, '1')
  } catch {
    // tenta de novo na próxima abertura
  }
}

export async function ensureDefaultExercises(): Promise<void> {
  await ensureV2()
  await ensureTimeExercises()
}