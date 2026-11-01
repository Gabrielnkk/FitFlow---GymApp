import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Exercise, WorkoutExercise } from '../types'
import { newId } from '../utils/id'
import ExercisePicker from '../components/ExercisePicker'
import ExerciseHowTo from '../components/ExerciseHowTo'

const smallInput =
  'w-full rounded-lg bg-slate-900 px-2 py-3 text-center text-lg text-slate-50 outline-none ring-1 ring-slate-600 focus:ring-emerald-400'

function toNumber(value: string): number {
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? 0 : Math.max(0, n)
}

export default function WorkoutEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const exercises = useLiveQuery(() => db.exercises.toArray())

  const [name, setName] = useState('')
  const [items, setItems] = useState<WorkoutExercise[]>([])
  const [loaded, setLoaded] = useState(!id)
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    db.workouts.get(id).then((w) => {
      if (!w) {
        navigate('/')
        return
      }
      setName(w.name)
      setItems(w.items)
      setLoaded(true)
    })
  }, [id, navigate])

  const exerciseById = new Map<string, Exercise>((exercises ?? []).map((e) => [e.id, e]))

  function addExercise(e: Exercise) {
    setItems((prev) => [
      ...prev,
      {
        exerciseId: e.id,
        sets: 3,
        targetReps: 10,
        restSeconds: 60,
        targetSeconds: e.mode === 'time' ? (e.muscleGroup === 'Cardio' ? 600 : 30) : undefined,
      },
    ])
    setPicking(false)
  }

  function updateItem(index: number, patch: Partial<WorkoutExercise>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

    function removeItem(index: number) {
    if (!window.confirm('Remover este exercício do treino?')) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const copy = [...prev]
      ;[copy[index], copy[target]] = [copy[target], copy[index]]
      return copy
    })
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Digite o nome do treino.')
      return
    }
    if (items.length === 0) {
      setError('Adicione pelo menos um exercício.')
      return
    }
    const cleanItems = items.map((it) => ({
      ...it,
      sets: Math.max(1, it.sets),
      targetReps: Math.max(1, it.targetReps),
      restSeconds: it.restSeconds,
    }))
    const now = Date.now()
    if (id) {
      await db.workouts.update(id, { name: name.trim(), items: cleanItems, updatedAt: now })
    } else {
      await db.workouts.add({
        id: newId(),
        name: name.trim(),
        items: cleanItems,
        createdAt: now,
        updatedAt: now,
      })
    }
    navigate('/')
  }

  if (!loaded) return <div className="p-4 text-slate-400">Carregando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-3 text-base text-slate-400">
        ← Voltar
      </button>
      <h1 className="mb-4 text-3xl font-bold text-emerald-400">
        {id ? 'Editar treino' : 'Novo treino'}
      </h1>

      <label className="mb-5 block">
        <span className="mb-1 block text-sm text-slate-300">Nome do treino</span>
        <input
          className="w-full rounded-xl bg-slate-800 px-4 py-3 text-base outline-none ring-1 ring-slate-600 focus:ring-emerald-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Treino A - Peito e Tríceps"
        />
      </label>

      <ul className="space-y-3">
        {items.map((it, index) => {
          const ex = exerciseById.get(it.exerciseId)
          return (
            <li key={index} className="rounded-xl bg-slate-800 p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold">
                    {ex ? ex.name : '(exercício removido)'}
                  </div>
                  {ex && <div className="text-sm text-slate-400">{ex.muscleGroup}</div>}
                  {ex && (
                    <div className="mt-1">
                      <ExerciseHowTo name={ex.name} />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg bg-slate-700 px-3 py-2 disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="rounded-lg bg-slate-700 px-3 py-2 disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    ↓
                  </button>
                                    <button
                    onClick={() => updateItem(index, { superset: !it.superset })}
                    disabled={index === items.length - 1}
                    className={`rounded-lg px-3 py-2 disabled:opacity-30 ${
                      it.superset ? 'bg-emerald-500 text-white' : 'bg-slate-700'
                    }`}
                    aria-label="Superset com o próximo exercício"
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => removeItem(index)}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-red-400"
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label>
                  <span className="mb-1 block text-center text-xs text-slate-400">Séries</span>
                  <input
                    className={smallInput}
                    inputMode="numeric"
                    value={it.sets}
                    onChange={(e) => updateItem(index, { sets: toNumber(e.target.value) })}
                  />
                </label>
                                {ex?.mode === 'time' ? (
                  <label>
                    <span className="mb-1 block text-center text-xs text-slate-400">Tempo (s)</span>
                    <input
                      className={smallInput}
                      inputMode="numeric"
                      value={it.targetSeconds ?? 30}
                      onChange={(e) => updateItem(index, { targetSeconds: toNumber(e.target.value) })}
                    />
                  </label>
                ) : (
                  <label>
                    <span className="mb-1 block text-center text-xs text-slate-400">Reps</span>
                    <input
                      className={smallInput}
                      inputMode="numeric"
                      value={it.targetReps}
                      onChange={(e) => updateItem(index, { targetReps: toNumber(e.target.value) })}
                    />
                  </label>
                )}
                <label>
                  <span className="mb-1 block text-center text-xs text-slate-400">Descanso (s)</span>
                  <input
                    className={smallInput}
                    inputMode="numeric"
                    value={it.restSeconds}
                    onChange={(e) => updateItem(index, { restSeconds: toNumber(e.target.value) })}
                  />
                </label>
              </div>
            </li>
          )
        })}
      </ul>

      <button
        onClick={() => setPicking(true)}
        className="mt-4 w-full rounded-xl border-2 border-dashed border-slate-600 py-4 text-lg font-semibold text-slate-300 active:bg-slate-800"
      >
        + Adicionar exercício
      </button>

      {error && <p className="mt-3 text-center text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        className="mt-5 w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-slate-900 active:bg-emerald-600"
      >
        Salvar treino
      </button>

      {picking && <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />}
    </div>
  )
}