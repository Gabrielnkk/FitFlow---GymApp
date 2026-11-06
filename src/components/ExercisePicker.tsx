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
}

export default function ExercisePicker({ onPick, onClose }: Props) {
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<GroupFilter>('Todos')

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
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onPick(e)}
                className="w-full rounded-xl bg-slate-900 p-3 text-left active:bg-slate-700"
              >
                <div className="font-semibold">{e.name}</div>
                <div className="text-sm text-slate-400">{e.muscleGroup}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
