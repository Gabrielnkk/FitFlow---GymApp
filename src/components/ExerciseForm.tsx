import { useState } from 'react'
import { MUSCLE_GROUPS, type Exercise, type ExerciseMode, type MuscleGroup } from '../types'

export interface ExerciseData {
  name: string
  muscleGroup: MuscleGroup
  equipment: string
  notes: string
  mode: ExerciseMode
}

interface Props {
  initial?: Exercise
  onSave: (data: ExerciseData) => void
  onDelete?: () => void
  onCancel: () => void
}

const inputClass =
  'w-full rounded-xl bg-slate-900 px-4 py-3 text-base text-slate-50 outline-none ring-1 ring-slate-600 focus:ring-emerald-400'

export default function ExerciseForm({ initial, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(
    initial?.muscleGroup ?? 'Peito',
  )
  const [equipment, setEquipment] = useState(initial?.equipment ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [mode, setMode] = useState<ExerciseMode>(initial?.mode ?? 'reps')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Digite o nome do exercício.')
      return
    }
    onSave({
      name: name.trim(),
      muscleGroup,
      equipment: equipment.trim(),
      notes: notes.trim(),
      mode,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Nome</span>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Supino reto"
        />
        {error && <span className="mt-1 block text-sm text-red-400">{error}</span>}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Grupo muscular</span>
        <select
          className={inputClass}
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
        >
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Como medir</span>
        <select
          className={inputClass}
          value={mode}
          onChange={(e) => setMode(e.target.value as ExerciseMode)}
        >
          <option value="reps">Repetições (ex.: 10 reps)</option>
          <option value="time">Tempo (ex.: prancha 30 s)</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Equipamento</span>
        <input
          className={inputClass}
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="Ex.: Barra, Halteres, Máquina"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Observações</span>
        <textarea
          className={inputClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: banco na posição 3"
        />
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-slate-700 py-4 text-lg font-semibold"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-emerald-500 py-4 text-lg font-semibold text-slate-900 active:bg-emerald-600"
        >
          Salvar
        </button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-xl py-3 text-base font-semibold text-red-400"
        >
          Excluir exercício
        </button>
      )}
    </form>
  )
}