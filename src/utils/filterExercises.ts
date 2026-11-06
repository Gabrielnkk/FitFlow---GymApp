// made by: Gabriel Mattos
import type { Exercise, MuscleGroup } from '../types'

export type GroupFilter = MuscleGroup | 'Todos'

/** Aplica o grupo muscular e a busca (pelo nome) juntos e devolve a lista em ordem alfabética. */
export function filterExercises(list: Exercise[], search: string, group: GroupFilter): Exercise[] {
  const term = search.trim().toLowerCase()
  return list
    .filter((e) => group === 'Todos' || e.muscleGroup === group)
    .filter((e) => e.name.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
