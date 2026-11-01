import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import Modal from '../components/Modal'
import { db } from '../db/database'
import {
  ACTIVITY,
  OBJECTIVES,
  MEALS,
  addDays,
  calcGoal,
  dateKey,
  getGoal,
  keyToDate,
  nutritionDb,
  saveGoal,
  sumMacros,
  type Activity,
  type FoodEntry,
  type Macros,
  type Meal,
  type Objective,
} from '../db/nutrition'
import { latestValue } from '../utils/calculators'
import { getProfile, saveProfile, type Sex } from '../utils/profile'
import { getApiKey } from '../assistant/config'
import { estimateFood, imageToBase64, type EstimatedFood } from '../assistant/estimateFood'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function toNum(s: string): number {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isNaN(n) || n < 0 ? 0 : n
}

function r1(n: number): number {
  return Math.round(n * 10) / 10
}

function fmtG(n: number): string {
  return String(Math.round(n))
}

const inputClass =
  'w-full rounded-xl bg-slate-700 px-3 py-3 text-base text-slate-50 outline-none placeholder:text-slate-500'

// ---------- Anel de calorias ----------
function Ring({ eaten, goal }: { eaten: number; goal: number | null }) {
  const R = 52
  const C = 2 * Math.PI * R
  const pct = goal ? Math.min(1, eaten / goal) : 0
  const over = goal !== null && eaten > goal
  const remaining = goal !== null ? Math.round(goal - eaten) : 0
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" strokeWidth="11" className="stroke-slate-700" />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          className={over ? 'stroke-red-400' : 'stroke-emerald-400'}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold leading-none text-slate-50">
          {goal !== null ? Math.abs(remaining) : Math.round(eaten)}
        </span>
        <span className="mt-1 px-3 text-[11px] leading-tight text-slate-400">
          {goal === null ? 'kcal consumidas' : over ? 'kcal acima da meta' : 'kcal restantes'}
        </span>
      </div>
    </div>
  )
}

function MacroBar({
  label,
  eaten,
  goal,
}: {
  label: string
  eaten: number
  goal: number | null
}) {
  const pct = goal ? Math.min(100, (eaten / goal) * 100) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="text-xs text-slate-400">
          {fmtG(eaten)}
          {goal !== null ? ` / ${fmtG(goal)}` : ''} g
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
        />
      </div>
    </div>
  )
}

// ---------- Faixa de dias ----------
function WeekStrip({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (key: string) => void
}) {
  const today = dateKey(new Date())
  const sunday = addDays(selected, -keyToDate(selected).getDay())
  const days = Array.from({ length: 7 }, (_, i) => addDays(sunday, i))
  return (
    <div className="mb-4 flex items-center">
      <button
        onClick={() => onSelect(addDays(selected, -7))}
        className="px-2 py-3 text-2xl text-slate-400"
        aria-label="Semana anterior"
      >
        ‹
      </button>
      <div className="flex flex-1 justify-between">
        {days.map((k) => {
          const d = keyToDate(k)
          const active = k === selected
          return (
            <button
              key={k}
              onClick={() => onSelect(k)}
              className={`flex w-10 flex-col items-center rounded-xl py-2 ${
                active ? 'bg-slate-700' : ''
              }`}
            >
              <span className={`text-[11px] ${active ? 'text-slate-50' : 'text-slate-400'}`}>
                {k === today ? 'Hoje' : DAY_LABELS[d.getDay()]}
              </span>
              <span
                className={`mt-0.5 text-lg font-semibold ${
                  active ? 'text-slate-50' : 'text-slate-300'
                }`}
              >
                {d.getDate()}
              </span>
            </button>
          )
        })}
      </div>
      <button
        onClick={() => onSelect(addDays(selected, 7))}
        className="px-2 py-3 text-2xl text-slate-400"
        aria-label="Próxima semana"
      >
        ›
      </button>
    </div>
  )
}

// ---------- Adicionar / editar alimento ----------
type Mode = 'menu' | 'manual' | 'recent' | 'ai'

function AddSheet({
  date,
  initialMeal,
  editing,
  onClose,
}: {
  date: string
  initialMeal: Meal
  editing: FoodEntry | null
  onClose: () => void
}) {
  const [mode, setMode] = useState<Mode>(editing ? 'manual' : 'menu')
  const [meal, setMeal] = useState<Meal>(editing?.meal ?? initialMeal)
  const [name, setName] = useState(editing?.name ?? '')
  const [kcal, setKcal] = useState(editing ? String(editing.kcal) : '')
  const [protein, setProtein] = useState(editing ? String(editing.protein) : '')
  const [carbs, setCarbs] = useState(editing ? String(editing.carbs) : '')
  const [fat, setFat] = useState(editing ? String(editing.fat) : '')
  const [servings, setServings] = useState('1')
  const [search, setSearch] = useState('')

  // IA
  const [aiText, setAiText] = useState('')
  const [aiPhoto, setAiPhoto] = useState<File | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiItems, setAiItems] = useState<EstimatedFood[]>([])

  const recents = useLiveQuery(async () => {
    const all = await nutritionDb.entries.orderBy('id').reverse().limit(300).toArray()
    const seen = new Set<string>()
    const out: FoodEntry[] = []
    for (const e of all) {
      const k = e.name.trim().toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      out.push(e)
    }
    return out
  })

  const apiKey = getApiKey()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (recents ?? []).filter((e) => q === '' || e.name.toLowerCase().includes(q))
  }, [recents, search])

  function pick(e: FoodEntry) {
    setName(e.name)
    setKcal(String(e.kcal))
    setProtein(String(e.protein))
    setCarbs(String(e.carbs))
    setFat(String(e.fat))
    setServings('1')
    setMode('manual')
  }

  async function saveManual() {
    const mult = toNum(servings) || 1
    const data = {
      meal,
      name: name.trim() || 'Alimento',
      kcal: Math.round(toNum(kcal) * mult),
      protein: r1(toNum(protein) * mult),
      carbs: r1(toNum(carbs) * mult),
      fat: r1(toNum(fat) * mult),
    }
    if (editing?.id !== undefined) {
      await nutritionDb.entries.update(editing.id, data)
    } else {
      await nutritionDb.entries.add({ ...data, date, createdAt: Date.now() })
    }
    onClose()
  }

  async function runAi() {
    setAiBusy(true)
    setAiError('')
    try {
      const photo = aiPhoto ? await imageToBase64(aiPhoto) : undefined
      setAiItems(await estimateFood(apiKey, aiText, photo))
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Não consegui estimar agora.')
    } finally {
      setAiBusy(false)
    }
  }

  async function addAiItems() {
    const now = Date.now()
    await nutritionDb.entries.bulkAdd(
      aiItems.map((it, i) => ({ ...it, meal, date, createdAt: now + i })),
    )
    onClose()
  }

  const title = editing ? 'Editar alimento' : 'Adicionar alimento'

  return (
    <Modal title={title} onClose={onClose}>
      {!editing && (
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {MEALS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMeal(m.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                meal === m.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {mode === 'menu' && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'recent' as Mode, icon: '🕘', label: 'Recentes' },
            { id: 'manual' as Mode, icon: '✏️', label: 'Entrada manual' },
            { id: 'ai' as Mode, icon: '✨', label: 'Estimar com IA' },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setMode(o.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl bg-slate-700 py-5 text-base font-medium text-slate-50 ${
                o.id === 'ai' ? 'col-span-2' : ''
              }`}
            >
              <span className="text-2xl">{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {mode === 'recent' && (
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nos seus alimentos"
            className={`${inputClass} mb-3`}
          />
          {recents && filtered.length === 0 && (
            <p className="py-6 text-center text-slate-400">
              {recents.length === 0
                ? 'Ainda não há alimentos. Adicione o primeiro por entrada manual ou IA.'
                : 'Nenhum alimento com esse nome.'}
            </p>
          )}
          <ul className="max-h-80 divide-y divide-slate-700 overflow-y-auto">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => pick(e)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left"
                >
                  <span className="min-w-0 flex-1 truncate text-slate-50">{e.name}</span>
                  <span className="shrink-0 text-sm text-slate-400">{e.kcal} kcal</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome (ex.: Arroz com feijão)"
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-400">
              Calorias (kcal)
              <input
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Proteína (g)
              <input
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Carboidratos (g)
              <input
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="text-xs text-slate-400">
              Gordura (g)
              <input
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>
          {!editing && (
            <label className="block text-xs text-slate-400">
              Quantidade de porções (os valores acima são de 1 porção)
              <input
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                inputMode="decimal"
                className={`${inputClass} mt-1`}
              />
            </label>
          )}
          <button
            onClick={() => void saveManual()}
            className="w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-semibold text-white"
          >
            {editing ? 'Salvar' : 'Adicionar'}
          </button>
          {editing?.id !== undefined && (
            <button
              onClick={() => {
                void nutritionDb.entries.delete(editing.id as number)
                onClose()
              }}
              className="w-full py-2 text-base text-red-400"
            >
              Excluir alimento
            </button>
          )}
        </div>
      )}

      {mode === 'ai' && (
        <div className="space-y-3">
          {!apiKey ? (
            <div className="rounded-2xl bg-slate-700 p-4 text-sm text-slate-300">
              Para estimar com IA, cadastre sua chave do Gemini em{' '}
              <Link to="/ajustes?s=assistente" onClick={onClose} className="font-semibold text-emerald-400">
                Ajustes › Assistente
              </Link>
              .
            </div>
          ) : aiItems.length === 0 ? (
            <>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                rows={3}
                placeholder="Descreva o que comeu. Ex.: 150 g de arroz, 1 concha de feijão e 1 bife grelhado"
                className={inputClass}
              />
              <label className="flex items-center justify-between rounded-xl bg-slate-700 px-3 py-3 text-sm text-slate-300">
                <span className="truncate">
                  {aiPhoto ? `📷 ${aiPhoto.name}` : '📷 Anexar foto do prato (opcional)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAiPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
              {aiError && <p className="text-sm text-red-400">{aiError}</p>}
              <button
                onClick={() => void runAi()}
                disabled={aiBusy || (aiText.trim() === '' && !aiPhoto)}
                className="w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
              >
                {aiBusy ? 'Estimando...' : '✨ Estimar'}
              </button>
              <p className="text-xs text-slate-500">
                É uma estimativa. Você pode conferir e remover itens antes de adicionar.
              </p>
            </>
          ) : (
            <>
              <ul className="divide-y divide-slate-700">
                {aiItems.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-slate-50">{it.name}</p>
                      <p className="text-xs text-slate-400">
                        {it.kcal} kcal · P {fmtG(it.protein)} · C {fmtG(it.carbs)} · G {fmtG(it.fat)}
                      </p>
                    </div>
                    <button
                      onClick={() => setAiItems(aiItems.filter((_, j) => j !== i))}
                      className="px-2 text-lg text-slate-400"
                      aria-label="Remover"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => void addAiItems()}
                className="w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-semibold text-white"
              >
                Adicionar {aiItems.length} {aiItems.length === 1 ? 'item' : 'itens'} (
                {aiItems.reduce((t, x) => t + x.kcal, 0)} kcal)
              </button>
              <button onClick={() => setAiItems([])} className="w-full py-2 text-base text-slate-400">
                Refazer
              </button>
            </>
          )}
        </div>
      )}

      {mode !== 'menu' && !editing && (
        <button onClick={() => setMode('menu')} className="mt-4 w-full py-2 text-base text-slate-400">
          ‹ Voltar
        </button>
      )}
    </Modal>
  )
}

// ---------- Meta diária ----------
function GoalSheet({ latestWeight, onClose }: { latestWeight?: number; onClose: () => void }) {
  const profile = getProfile()
  const current = getGoal()
  const [sex, setSex] = useState<Sex>(profile.sex ?? 'm')
  const [age, setAge] = useState(profile.age ? String(profile.age) : '')
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : '')
  const [weight, setWeight] = useState(latestWeight ? String(latestWeight) : '')
  const [activity, setActivity] = useState<Activity>('leve')
  const [objective, setObjective] = useState<Objective>('manter')
  const [kcal, setKcal] = useState(current ? String(current.kcal) : '')
  const [protein, setProtein] = useState(current ? String(current.protein) : '')
  const [carbs, setCarbs] = useState(current ? String(current.carbs) : '')
  const [fat, setFat] = useState(current ? String(current.fat) : '')

  const canCalc = toNum(age) > 0 && toNum(height) > 0 && toNum(weight) > 0

  function calculate() {
    const g = calcGoal({
      sex,
      age: toNum(age),
      heightCm: toNum(height),
      weightKg: toNum(weight),
      activity,
      objective,
    })
    setKcal(String(g.kcal))
    setProtein(String(g.protein))
    setCarbs(String(g.carbs))
    setFat(String(g.fat))
    saveProfile({ sex, age: toNum(age), heightCm: toNum(height) })
  }

  function save() {
    const goal: Macros = {
      kcal: Math.round(toNum(kcal)),
      protein: Math.round(toNum(protein)),
      carbs: Math.round(toNum(carbs)),
      fat: Math.round(toNum(fat)),
    }
    if (goal.kcal > 0) saveGoal(goal)
    onClose()
  }

  return (
    <Modal title="Meta diária" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-400">
        Preencha os dados e toque em Calcular. Depois você pode ajustar os números à mão.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-400">
          Sexo
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
            className={`${inputClass} mt-1`}
          >
            <option value="m">Masculino</option>
            <option value="f">Feminino</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Idade
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            inputMode="numeric"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="text-xs text-slate-400">
          Altura (cm)
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            inputMode="numeric"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="text-xs text-slate-400">
          Peso (kg)
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            inputMode="decimal"
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>
      <label className="mt-3 block text-xs text-slate-400">
        Atividade
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value as Activity)}
          className={`${inputClass} mt-1`}
        >
          {ACTIVITY.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-xs text-slate-400">
        Objetivo
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value as Objective)}
          className={`${inputClass} mt-1`}
        >
          {OBJECTIVES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={calculate}
        disabled={!canCalc}
        className="mt-4 w-full rounded-2xl bg-slate-700 py-3 text-base font-semibold text-slate-50 disabled:opacity-40"
      >
        Calcular
      </button>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-400">
          Calorias (kcal)
          <input
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            inputMode="numeric"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="text-xs text-slate-400">
          Proteína (g)
          <input
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            inputMode="numeric"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="text-xs text-slate-400">
          Carboidratos (g)
          <input
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            inputMode="numeric"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="text-xs text-slate-400">
          Gordura (g)
          <input
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            inputMode="numeric"
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>
      <button
        onClick={save}
        disabled={toNum(kcal) <= 0}
        className="mt-4 w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
      >
        Salvar meta
      </button>
      <p className="mt-3 text-xs text-slate-500">
        O cálculo é uma estimativa de partida. Se o peso não mudar como você espera em 2 semanas,
        ajuste as calorias.
      </p>
    </Modal>
  )
}

// ---------- Página ----------
export default function NutritionPage() {
  const [date, setDate] = useState(dateKey(new Date()))
  const [sheet, setSheet] = useState<{ meal: Meal; editing: FoodEntry | null } | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalVersion, setGoalVersion] = useState(0)

  const entries = useLiveQuery(
    () => nutritionDb.entries.where('date').equals(date).toArray(),
    [date],
  )
  const body = useLiveQuery(() => db.bodyEntries.toArray())

  // goalVersion força reler a meta depois de salvar
  const goal = useMemo(() => getGoal(), [goalVersion])

  if (!entries) return <div className="p-4 text-slate-400">Carregando...</div>

  const total = sumMacros(entries)
  const latestWeight = body ? latestValue(body, 'weight') : undefined

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dieta</h1>
        <button
          onClick={() => setGoalOpen(true)}
          className="rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300"
        >
          🎯 Meta
        </button>
      </div>

      <WeekStrip selected={date} onSelect={setDate} />

      <section className="mb-4 rounded-3xl bg-slate-800 p-4">
        <div className="flex items-center gap-4">
          <Ring eaten={total.kcal} goal={goal?.kcal ?? null} />
          <div className="flex-1 space-y-3">
            <MacroBar label="Carboidratos" eaten={total.carbs} goal={goal?.carbs ?? null} />
            <MacroBar label="Proteína" eaten={total.protein} goal={goal?.protein ?? null} />
            <MacroBar label="Gordura" eaten={total.fat} goal={goal?.fat ?? null} />
          </div>
        </div>
        {goal ? (
          <p className="mt-3 text-center text-xs text-slate-400">
            {Math.round(total.kcal)} de {goal.kcal} kcal
          </p>
        ) : (
          <button
            onClick={() => setGoalOpen(true)}
            className="mt-4 w-full rounded-2xl bg-slate-700 py-3 text-base font-semibold text-slate-50"
          >
            Definir minha meta diária
          </button>
        )}
      </section>

      <div className="space-y-3">
        {MEALS.map((m) => {
          const list = entries
            .filter((e) => e.meal === m.id)
            .sort((a, b) => a.createdAt - b.createdAt)
          const sum = sumMacros(list)
          return (
            <section key={m.id} className="rounded-2xl bg-slate-800 p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-50">{m.label}</h2>
                <span className="text-sm text-slate-400">{Math.round(sum.kcal)} kcal</span>
              </div>
              {list.length > 0 && (
                <ul className="mt-2 divide-y divide-slate-700">
                  {list.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => setSheet({ meal: e.meal, editing: e })}
                        className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-slate-50">{e.name}</span>
                          <span className="block text-xs text-slate-400">
                            P {fmtG(e.protein)} · C {fmtG(e.carbs)} · G {fmtG(e.fat)}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-medium text-slate-200">
                          {e.kcal} kcal
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => setSheet({ meal: m.id, editing: null })}
                className="mt-2 w-full rounded-xl py-2 text-left text-sm font-semibold text-emerald-400"
              >
                + Adicionar
              </button>
            </section>
          )
        })}
      </div>

      {sheet && (
        <AddSheet
          date={date}
          initialMeal={sheet.meal}
          editing={sheet.editing}
          onClose={() => setSheet(null)}
        />
      )}
      {goalOpen && (
        <GoalSheet
          latestWeight={latestWeight}
          onClose={() => {
            setGoalOpen(false)
            setGoalVersion((v) => v + 1)
          }}
        />
      )}
    </div>
  )
}