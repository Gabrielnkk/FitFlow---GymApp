// made by: Gabriel Mattos
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Exercise } from '../types'
import { filterExercises, type GroupFilter } from '../utils/filterExercises'
import ExerciseFilters from './ExerciseFilters'
import Modal from './Modal'

interface Props {
  onPick: (exercise: Exercise) => void
  onClose: () => void
  /** Exercícios que já estão no treino: aparecem marcados e não podem ser escolhidos de novo */
  disabledIds?: readonly string[]
}

export default function ExercisePicker({ onPick, onClose, disabledIds = [] }: Props) {
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<GroupFilter>('Todos')

  const taken = new Set(disabledIds)
  const filtered = filterExercises(exercises ?? [], search, group)

  return (
    <Modal title="Escolher exercício" onClose={onClose}>
      <ExerciseFilters
        search={search}
        onSearch={setSearch}
        group={group}
        onGroup={setGroup}
        surface="sheet"
      />
      {/* busca e pílulas ficam fixas no topo; só a lista rola */}
      <div className="mt-3 max-h-[45dvh] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-slate-400">Nenhum exercício encontrado.</p>
        )}
        <ul className="space-y-2">
          {filtered.map((e) => {
            const already = taken.has(e.id)
            return (
              <li key={e.id}>
                <button
                  onClick={() => onPick(e)}
                  disabled={already}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-900 p-3 text-left active:bg-slate-700 disabled:opacity-50 disabled:active:bg-slate-900"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{e.name}</span>
                    <span className="block text-sm text-slate-400">{e.muscleGroup}</span>
                  </span>
                  {already && (
                    <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300">
                      ✓ Já no treino
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}
