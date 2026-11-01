import { db } from './database'
import type { Workout } from '../types'

// Com ordem definida vem primeiro; sem ordem, os mais recentes primeiro
export function sortWorkouts(list: Workout[]): Workout[] {
  return [...list].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    return b.updatedAt - a.updatedAt
  })
}

// "list" é a lista como aparece na tela. Move o item uma casa para cima (-1) ou baixo (1).
export async function moveWorkout(
  list: Workout[],
  index: number,
  direction: -1 | 1,
): Promise<void> {
  const target = index + direction
  if (target < 0 || target >= list.length) return
  const ids = list.map((w) => w.id)
  ;[ids[index], ids[target]] = [ids[target], ids[index]]
  await db.transaction('rw', db.workouts, async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.workouts.update(ids[i], { order: i })
    }
  })
}