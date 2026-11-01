import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { BodyEntry } from '../types'
import {
  bmi,
  bmiCategory,
  bodyFatCategory,
  bodyFatFromBmi,
  fmt,
  latestValue,
} from '../utils/calculators'
import { getProfile, saveProfile } from '../utils/profile'

// Cartão da aba Corpo: IMC, gordura e o atalho para o treino semanal
export default function BodyInsights({ entries }: { entries: BodyEntry[] }) {
  const [height, setHeight] = useState<number | undefined>(() => getProfile().heightCm)
  const [text, setText] = useState('')

  const weight = latestValue(entries, 'weight')
  if (entries.length === 0) return null

  const profile = getProfile()
  const imc = weight && height ? bmi(weight, height) : null
  const sex = profile.sex ?? 'm'
  const fatEntry = latestValue(entries, 'bodyFat')
  const fat = fatEntry ?? (imc && profile.age ? bodyFatFromBmi(imc, profile.age, sex) : null)

  function saveHeight() {
    const n = parseFloat(text.replace(',', '.'))
    if (Number.isFinite(n) && n > 100 && n < 250) {
      saveProfile({ heightCm: n })
      setHeight(n)
    }
  }

  return (
    <section className="mb-5 rounded-xl bg-slate-800 p-4">
      {!height && weight && (
        <div className="mb-3">
          <label className="mb-1 block text-sm text-slate-300">
            Informe sua altura (cm) para calcular o IMC
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded-xl bg-slate-900 p-3 text-lg ring-1 ring-slate-600 outline-none"
            />
            <button onClick={saveHeight} className="rounded-xl bg-emerald-500 px-4 font-bold text-slate-900">
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="text-2xl font-bold text-emerald-400">{imc ? fmt(imc) : '—'}</div>
          <div className="text-xs text-slate-400">{imc ? `IMC · ${bmiCategory(imc)}` : 'IMC'}</div>
        </div>
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="text-2xl font-bold text-emerald-400">
            {fat !== null ? `${fatEntry === undefined ? '≈ ' : ''}${fmt(fat)}%` : '—'}
          </div>
          <div className="text-xs text-slate-400">
            {fat !== null ? `Gordura · ${bodyFatCategory(sex, fat)}` : 'Gordura corporal'}
          </div>
        </div>
      </div>

      <Link
        to="/plano"
        className="mt-3 block rounded-xl bg-emerald-500 py-3 text-center font-bold text-slate-900"
      >
        Montar treino semanal
      </Link>
    </section>
  )
}