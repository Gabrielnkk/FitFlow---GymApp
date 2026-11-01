import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { generatePlan, savePlan } from '../db/plan'
import type { Goal } from '../db/plan'
import { bmi, bmiCategory, fmt, latestValue } from '../utils/calculators'
import { setWeeklyGoal } from '../utils/frequency'
import { getProfile, saveProfile } from '../utils/profile'
import type { Experience } from '../utils/profile'

const EXPERIENCES: { value: Experience; label: string; hint: string }[] = [
  { value: 'iniciante', label: 'Iniciante', hint: 'menos de 6 meses' },
  { value: 'intermediario', label: 'Intermediário', hint: '6 meses a 2 anos' },
  { value: 'avancado', label: 'Avançado', hint: 'mais de 2 anos' },
]

const GOALS: { value: Goal; label: string }[] = [
  { value: 'hipertrofia', label: 'Ganhar massa' },
  { value: 'emagrecer', label: 'Emagrecer' },
  { value: 'forca', label: 'Ganhar força' },
]

function Choice({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean
  onClick: () => void
  title: string
  hint?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-2 py-3 text-center ${
        active ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-200'
      }`}
    >
      <div className="font-bold">{title}</div>
      {hint && <div className="text-xs opacity-80">{hint}</div>}
    </button>
  )
}

export default function PlanPage() {
  const navigate = useNavigate()
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const entries = useLiveQuery(() => db.bodyEntries.toArray())

  const profile = getProfile()
  const [experience, setExperience] = useState<Experience>(profile.experience ?? 'iniciante')
  const [days, setDays] = useState(3)
  const [goalPick, setGoalPick] = useState<Goal | null>(null)
  const [saving, setSaving] = useState(false)

  const weight = entries ? latestValue(entries, 'weight') : undefined
  const fat = entries ? latestValue(entries, 'bodyFat') : undefined
  const imc = weight && profile.heightCm ? bmi(weight, profile.heightCm) : null

  // Sugestão a partir do corpo: IMC alto ou gordura alta sugerem emagrecer
  const highFat = fat !== undefined && (profile.sex === 'f' ? fat >= 32 : fat >= 25)
  const suggested: Goal = (imc !== null && imc >= 27) || highFat ? 'emagrecer' : 'hipertrofia'
  const goal = goalPick ?? suggested

  const plan = exercises ? generatePlan(exercises, { days, experience, goal }) : []
  const names = new Map((exercises ?? []).map((e) => [e.id, e.name]))

  async function handleSave() {
    setSaving(true)
    await savePlan(plan)
    saveProfile({ experience })
    setWeeklyGoal(days)
    setSaving(false)
    window.alert('Treinos criados! Eles estão no topo da aba Treinos.')
    navigate('/')
  }

  return (
    <div className="p-4">
      <Link to="/progresso/corpo" className="text-sm text-emerald-400">
        ‹ Voltar
      </Link>
      <h1 className="mb-4 mt-1 text-3xl font-bold text-emerald-400">Treino semanal</h1>

      <section className="mb-5 rounded-xl bg-slate-800 p-4 text-sm text-slate-300">
        {weight ? (
          <>
            Peso atual: <b>{fmt(weight)} kg</b>
            {imc !== null && (
              <>
                {' '}
                · IMC <b>{fmt(imc)}</b> ({bmiCategory(imc)})
              </>
            )}
            {fat !== undefined && (
              <>
                {' '}
                · Gordura <b>{fmt(fat)}%</b>
              </>
            )}
            <div className="mt-1 text-slate-400">
              Objetivo sugerido para o seu corpo: <b>{GOALS.find((g) => g.value === suggested)?.label}</b>
            </div>
          </>
        ) : (
          'Registre o seu peso na aba Corpo para o app sugerir o objetivo. Você pode montar o plano mesmo assim.'
        )}
      </section>

      <h2 className="mb-2 text-lg font-bold">Há quanto tempo você treina?</h2>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {EXPERIENCES.map((e) => (
          <Choice
            key={e.value}
            active={experience === e.value}
            onClick={() => setExperience(e.value)}
            title={e.label}
            hint={e.hint}
          />
        ))}
      </div>

      <h2 className="mb-2 text-lg font-bold">Dias de treino por semana</h2>
      <div className="mb-5 grid grid-cols-5 gap-2">
        {[2, 3, 4, 5, 6].map((d) => (
          <Choice key={d} active={days === d} onClick={() => setDays(d)} title={String(d)} />
        ))}
      </div>

      <h2 className="mb-2 text-lg font-bold">Objetivo</h2>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {GOALS.map((g) => (
          <Choice
            key={g.value}
            active={goal === g.value}
            onClick={() => setGoalPick(g.value)}
            title={g.label}
            hint={g.value === suggested ? 'sugerido' : undefined}
          />
        ))}
      </div>

      <h2 className="mb-2 text-lg font-bold">Seu plano</h2>
      {plan.map((d, i) => (
        <section key={i} className="mb-3 rounded-xl bg-slate-800 p-4">
          <div className="mb-2 font-bold text-emerald-400">{d.name}</div>
          <ul className="space-y-1 text-sm text-slate-200">
            {d.items.map((it, j) => (
              <li key={j}>
                {names.get(it.exerciseId) ?? 'Exercício'} ·{' '}
                {it.targetSeconds
                  ? `${it.sets}× ${it.targetSeconds >= 120 ? `${Math.round(it.targetSeconds / 60)} min` : `${it.targetSeconds} s`}`
                  : `${it.sets}×${it.targetReps}`}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button
        onClick={handleSave}
        disabled={saving || plan.length === 0}
        className="mt-2 w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-slate-900 disabled:opacity-50"
      >
        Criar estes treinos
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">
        Os treinos entram na aba Treinos e a meta semanal do calendário passa a ser {days} dias.
      </p>
    </div>
  )
}