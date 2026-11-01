import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Exercise } from '../types'
import Modal from './Modal'

interface Props {
  onPick: (exercise: Exercise) => void
  onClose: () => void
}

export default function ExercisePicker({ onPick, onClose }: Props) {
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const [search, setSearch] = useState('')

  const filtered = (exercises ?? [])
    .filter((e) =>
      `${e.name} ${e.muscleGroup}`.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return (
    <Modal title="Escolher exercício" onClose={onClose}>
      <input
        className="mb-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-base outline-none ring-1 ring-slate-600 focus:ring-emerald-400"
        placeholder="🔎 Buscar"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
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
    </Modal>
  )
}