import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { recommendDiet, type DietRecommendation } from '../assistant/diet'
import { getApiKey } from '../assistant/config'
import { nutritionDb, type Macros, type SavedDietPlan } from '../db/nutrition'
import { getProfile } from '../utils/profile'

function macroText(macros: Macros): string {
  return `${Math.round(macros.kcal)} kcal · P ${Math.round(macros.protein)} g · C ${Math.round(macros.carbs)} g · G ${Math.round(macros.fat)} g`
}

function PlanDetails({ recommendation }: { recommendation: DietRecommendation }) {
  return (
    <div className="mt-3 space-y-3">
      {recommendation.summary && (
        <p className="rounded-2xl bg-slate-700 p-3 text-sm text-slate-200">
          {recommendation.summary}
        </p>
      )}
      {recommendation.meals.map((meal, index) => (
        <article key={`${meal.name}-${index}`} className="rounded-2xl bg-slate-700/70 p-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-slate-50">{meal.name}</h4>
            <span className="shrink-0 text-xs text-slate-300">{macroText(meal)}</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {meal.foods.map((food, foodIndex) => (
              <li key={`${food.name}-${foodIndex}`}>
                • {food.name}{food.portion ? ` — ${food.portion}` : ''}
              </li>
            ))}
          </ul>
        </article>
      ))}
      <p className="text-center text-sm font-medium text-slate-200">
        Total estimado: {macroText(recommendation.totals)}
      </p>
    </div>
  )
}

export default function DietRecommendation({
  latestWeight,
  goal,
}: {
  latestWeight?: number
  goal: Macros | null
}) {
  const apiKey = getApiKey()
  const [preferences, setPreferences] = useState('')
  const [recommendation, setRecommendation] = useState<DietRecommendation | null>(null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedPlanId, setSavedPlanId] = useState<number | null>(null)
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null)
  const savedPlans = useLiveQuery(
    () => nutritionDb.savedPlans.orderBy('createdAt').reverse().toArray(),
    [],
  )

  async function savePlan() {
    if (!recommendation || saving || savedPlanId !== null) return
    setSaving(true)
    setError('')
    try {
      const id = await nutritionDb.savedPlans.add({
        createdAt: Date.now(),
        recommendation,
      })
      setSavedPlanId(id)
      setExpandedPlanId(id)
    } catch (err) {
      setError(
        `Não foi possível salvar neste aparelho: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
      )
    } finally {
      setSaving(false)
    }
  }

  async function deletePlan(plan: SavedDietPlan) {
    if (plan.id === undefined || !window.confirm('Excluir este plano salvo?')) return
    setError('')
    try {
      await nutritionDb.savedPlans.delete(plan.id)
      if (expandedPlanId === plan.id) setExpandedPlanId(null)
    } catch (err) {
      setError(
        `Não foi possível excluir o plano: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
      )
    }
  }

  async function generate() {
    setBusy(true)
    setError('')
    try {
      setRecommendation(
        await recommendDiet(apiKey, {
          profile: getProfile(),
          latestWeight,
          goal,
          preferences,
        }),
      )
      setSavedPlanId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar a recomendação.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="my-4 rounded-3xl bg-slate-800 p-4">
      <div className="mb-1 flex items-center gap-2">
        <span aria-hidden="true" className="text-xl">✦</span>
        <h2 className="text-lg font-semibold text-slate-50">Recomendação da IA</h2>
      </div>
      <p className="mb-3 text-sm text-slate-400">
        Receba uma ideia de refeições para o dia, considerando sua meta e os dados disponíveis.
      </p>

      {!apiKey ? (
        <div className="rounded-2xl bg-slate-700 p-3 text-sm text-slate-300">
          Para gerar recomendações, cadastre sua chave Gemini em{' '}
          <Link to="/ajustes?s=assistente" className="font-semibold text-emerald-400">
            Ajustes › Assistente
          </Link>
          .
        </div>
      ) : (
        <>
          <label className="mb-3 block text-sm text-slate-300">
            Preferências, alergias ou alimentos a evitar
            <textarea
              value={preferences}
              onChange={(event) => setPreferences(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Ex.: vegetariano, sem lactose, alergia a amendoim"
              className="mt-1 w-full resize-y rounded-xl bg-slate-700 px-3 py-3 text-base text-slate-50 outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-400"
            />
          </label>

          <button
            onClick={() => void generate()}
            disabled={busy}
            className="w-full rounded-2xl bg-emerald-500 py-3 text-base font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Montando sugestão...' : recommendation ? 'Gerar outra sugestão' : 'Montar sugestão de refeições'}
          </button>

          {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}

          {recommendation && (
            <div className="mt-4">
              <PlanDetails recommendation={recommendation} />
              <button
                onClick={() => void savePlan()}
                disabled={saving || savedPlanId !== null}
                className="mt-3 w-full rounded-2xl bg-slate-700 py-3 text-base font-semibold text-slate-50 disabled:opacity-70"
              >
                {saving
                  ? 'Salvando...'
                  : savedPlanId !== null
                    ? '✓ Plano salvo neste aparelho'
                    : 'Salvar plano neste aparelho'}
              </button>
            </div>
          )}
        </>
      )}

      {savedPlans && savedPlans.length > 0 && (
        <div className="mt-5 border-t border-slate-700 pt-4">
          <h3 className="font-semibold text-slate-50">Planos salvos ({savedPlans.length})</h3>
          <ul className="mt-2 divide-y divide-slate-700">
            {savedPlans.map((plan) => (
              <li key={plan.id} className="py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setExpandedPlanId(expandedPlanId === plan.id ? null : (plan.id ?? null))
                    }
                    aria-expanded={expandedPlanId === plan.id}
                    className="min-w-0 flex-1 py-2 text-left"
                  >
                    <span className="block font-medium text-slate-200">
                      Plano de {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {macroText(plan.recommendation.totals)}
                    </span>
                  </button>
                  <button
                    onClick={() => void deletePlan(plan)}
                    className="shrink-0 rounded-lg px-3 py-2 text-sm text-red-400"
                    aria-label="Excluir plano salvo"
                  >
                    Excluir
                  </button>
                </div>
                {expandedPlanId === plan.id && (
                  <PlanDetails recommendation={plan.recommendation} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Sugestão geral e estimada, não substitui orientação profissional. A meta, os dados de perfil disponíveis e as preferências informadas são enviados ao Google Gemini para gerar a resposta. Os planos salvos ficam neste navegador/aparelho e não são sincronizados.
      </p>
    </section>
  )
}
