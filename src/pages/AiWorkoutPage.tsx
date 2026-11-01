import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { generateWorkout } from '../assistant/generate'
import type { GeneratedWorkout } from '../assistant/generate'
import { getApiKey } from '../assistant/config'
import { db } from '../db/database'
import { newId } from '../utils/id'

const EXAMPLES = [
  'Treino de peito e tríceps para hipertrofia, uns 50 minutos',
  'Treino de pernas e glúteos, foco em força',
  'Treino rápido de corpo todo, 30 minutos',
  'Costas e bíceps, sem equipamento pesado',
]

export default function AiWorkoutPage() {
  const navigate = useNavigate()
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const [request, setRequest] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GeneratedWorkout | null>(null)

  const hasKey = getApiKey() !== ''
  const nameOf = new Map((exercises ?? []).map((e) => [e.id, e.name]))

  async function generate() {
    if (!exercises) return
    if (request.trim().length < 5) {
      setError('Conte o que você quer treinar.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      setResult(await generateWorkout(getApiKey(), request.trim(), exercises))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não consegui gerar o treino.')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!result) return
    const now = Date.now()
    await db.workouts.add({
      id: newId(),
      name: result.name,
      items: result.items,
      createdAt: now,
      updatedAt: now,
    })
    navigate('/')
  }

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-3 text-base text-slate-400">
        ← Voltar
      </button>
      <h1 className="mb-1 text-3xl font-bold">Treino com IA</h1>
      <p className="mb-4 text-sm text-slate-400">
        Descreva o treino que você quer. A IA monta usando os exercícios do seu app e você salva
        como rotina.
      </p>

      {!hasKey && (
        <div className="mb-4 rounded-xl bg-slate-800 p-4 text-sm text-slate-300">
          Para usar, cole a sua chave do Gemini em <b>Ajustes → Assistente IA</b>. Precisa de
          internet.
        </div>
      )}

      <textarea
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        rows={3}
        placeholder="Ex.: treino de peito e tríceps para hipertrofia, 50 minutos"
        className="mb-2 w-full rounded-xl bg-slate-800 px-4 py-3 text-base outline-none ring-1 ring-slate-600 focus:ring-emerald-400"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setRequest(ex)}
            className="rounded-full bg-slate-700 px-3 py-1.5 text-xs text-slate-300"
          >
            {ex}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={busy || !hasKey}
        className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white disabled:opacity-50"
      >
        {busy ? 'Montando seu treino...' : '✨ Gerar treino'}
      </button>

      {error && <p className="mt-3 text-center text-red-400">{error}</p>}

      {result && (
        <section className="mt-5 rounded-xl bg-slate-800 p-4">
          <h2 className="mb-3 text-xl font-bold">{result.name}</h2>
          <ul className="mb-4 space-y-2">
            {result.items.map((it) => (
              <li key={it.exerciseId} className="flex justify-between gap-3">
                <span className="font-semibold">{nameOf.get(it.exerciseId) ?? 'Exercício'}</span>
                <span className="shrink-0 text-slate-300">
                  {it.sets}×{it.targetSeconds ? `${it.targetSeconds}s` : it.targetReps}
                </span>
              </li>
            ))}
          </ul>
          {result.skipped.length > 0 && (
            <p className="mb-3 text-xs text-slate-400">
              Ignorados (não existem na sua lista): {result.skipped.join(', ')}.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={generate} className="rounded-lg bg-slate-700 py-3 font-semibold">
              Gerar outro
            </button>
            <button onClick={save} className="rounded-lg bg-emerald-500 py-3 font-bold text-white">
              Salvar rotina
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Depois de salvar, você pode ajustar tudo em Editar.
          </p>
        </section>
      )}
    </div>
  )
}