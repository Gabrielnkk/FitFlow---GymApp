// made by: Gabriel Mattos
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { MUSCLE_GROUPS, type Exercise } from '../types'
import { newId } from '../utils/id'
import Modal from '../components/Modal'
import ExerciseForm, { type ExerciseData } from '../components/ExerciseForm'
import ExerciseFilters from '../components/ExerciseFilters'
import { filterExercises, type GroupFilter } from '../utils/filterExercises'
import ExerciseHowTo from '../components/ExerciseHowTo'
import { DumbbellIcon } from '../components/Icons'
import { ChevronIcon } from '../components/SettingsIcons'

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </h2>
  )
}

export default function ExercisesPage() {
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<GroupFilter>('Todos')
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null)

  const filtered = filterExercises(exercises ?? [], search, group)

  // Agrupa por músculo, na ordem da lista de grupos
  const sections = MUSCLE_GROUPS.map((g) => ({
    group: g,
    items: filtered.filter((e) => e.muscleGroup === g),
  })).filter((s) => s.items.length > 0)

  async function handleSave(data: ExerciseData) {
    if (editing === 'new') {
      await db.exercises.add({ id: newId(), ...data, isDefault: false })
    } else if (editing) {
      await db.exercises.update(editing.id, data)
    }
    setEditing(null)
  }

  async function handleDelete() {
    if (!editing || editing === 'new') return
    if (window.confirm(`Excluir "${editing.name}"?`)) {
      await db.exercises.delete(editing.id)
      setEditing(null)
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl font-bold text-emerald-400">Exercícios</h1>

      <ExerciseFilters search={search} onSearch={setSearch} group={group} onGroup={setGroup} />

      {exercises && filtered.length === 0 && (
        <p className="py-8 text-center text-slate-400">Nenhum exercício encontrado.</p>
      )}

      {sections.map((s) => (
        <section key={s.group}>
          <SectionTitle>{s.group}</SectionTitle>
          <ul className="divide-y divide-slate-700/60">
            {s.items.map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <button
                  onClick={() => setEditing(e)}
                  className="flex min-w-0 flex-1 items-center gap-4 py-3.5 text-left active:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                    <DumbbellIcon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium text-slate-50">
                      {e.name}
                    </span>
                    <span className="block truncate text-sm text-slate-400">
                      {[e.equipment, e.mode === 'time' ? 'por tempo' : '']
                        .filter(Boolean)
                        .join(' · ') || 'Sem equipamento definido'}
                    </span>
                    {e.notes && (
                      <span className="block truncate text-xs text-slate-500">{e.notes}</span>
                    )}
                  </span>
                </button>
                <div className="shrink-0">
                  <ExerciseHowTo name={e.name} />
                </div>
                <button
                  onClick={() => setEditing(e)}
                  aria-label={`Editar ${e.name}`}
                  className="shrink-0 py-3.5 text-slate-500 active:opacity-60"
                >
                  <ChevronIcon />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button
        onClick={() => setEditing('new')}
        className="fixed right-4 rounded-full bg-emerald-500 px-6 py-4 text-lg font-bold text-white shadow-lg active:opacity-80"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        + Novo
      </button>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Novo exercício' : 'Editar exercício'}
          onClose={() => setEditing(null)}
        >
          <ExerciseForm
            initial={editing === 'new' ? undefined : editing}
            onSave={handleSave}
            onDelete={editing === 'new' ? undefined : handleDelete}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}