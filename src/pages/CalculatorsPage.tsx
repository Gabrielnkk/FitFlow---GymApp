import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import {
  bmi,
  bmiCategory,
  bodyFatCategory,
  bodyFatFromBmi,
  bodyFatNavy,
  fmt,
  latestValue,
  oneRmFormulas,
  repsTable,
  waterMl,
} from '../utils/calculators'
import { getProfile, saveProfile } from '../utils/profile'
import type { Sex } from '../utils/profile'

function num(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

interface FieldProps {
  label: string
  unit?: string
  value: string
  onChange: (value: string) => void
  fill?: { text: string; value: string }
}

function Field({ label, unit, value, onChange, fill }: FieldProps) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 flex items-center justify-between text-sm text-slate-300">
        <span>
          {label}
          {unit ? ` (${unit})` : ''}
        </span>
        {fill && value !== fill.value && (
          <button
            type="button"
            onClick={() => onChange(fill.value)}
            className="rounded-md bg-slate-700 px-2 py-0.5 text-xs font-semibold text-emerald-400"
          >
            {fill.text}
          </button>
        )}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-slate-900 p-3 text-lg text-slate-50 outline-none ring-1 ring-slate-600"
      />
    </label>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      {children}
    </section>
  )
}

function Result({ children }: { children: ReactNode }) {
  return <div className="mt-1 rounded-lg bg-slate-900 p-3 text-slate-100">{children}</div>
}

export default function CalculatorsPage() {
  const entries = useLiveQuery(() => db.bodyEntries.toArray())
  const initial = getProfile()

  const [sex, setSex] = useState<Sex>(initial.sex ?? 'm')
  const [ageText, setAgeText] = useState(initial.age ? String(initial.age) : '')
  const [heightText, setHeightText] = useState(initial.heightCm ? String(initial.heightCm) : '')
  const [neckText, setNeckText] = useState(initial.neckCm ? String(initial.neckCm) : '')

  const [weightText, setWeightText] = useState('')
  const [waistText, setWaistText] = useState('')
  const [hipsText, setHipsText] = useState('')

  const [liftText, setLiftText] = useState('')
  const [repsText, setRepsText] = useState('')

  const [minutesText, setMinutesText] = useState('60')
  const [hot, setHot] = useState(false)

  const lastWeight = entries ? latestValue(entries, 'weight') : undefined
  const lastWaist = entries ? latestValue(entries, 'waist') : undefined
  const lastHips = entries ? latestValue(entries, 'hips') : undefined

  const age = num(ageText)
  const height = num(heightText)
  const neck = num(neckText)
  const weight = num(weightText)
  const waist = num(waistText)
  const hips = num(hipsText)

  const imc = weight && height ? bmi(weight, height) : null

  const navy = height && waist && neck ? bodyFatNavy(sex, height, waist, neck, hips ?? undefined) : null
  const estimate = imc && age ? bodyFatFromBmi(imc, age, sex) : null

  const lift = num(liftText)
  const reps = num(repsText)
  const oneRm = lift && reps && reps <= 30 ? oneRmFormulas(lift, Math.round(reps)) : null

  const minutes = Number.parseFloat(minutesText.replace(',', '.'))
  const water =
    weight && Number.isFinite(minutes) && minutes >= 0 ? waterMl(weight, age ?? undefined, minutes, hot) : null

  function chooseSex(value: Sex) {
    setSex(value)
    saveProfile({ sex: value })
  }

  const weightFill = lastWeight ? { text: `Último: ${fmt(lastWeight)} kg`, value: String(lastWeight).replace('.', ',') } : undefined

  return (
    <div className="p-4">
      <Link to="/ajustes" className="text-sm text-emerald-400">
        ‹ Voltar
      </Link>
      <h1 className="mb-4 mt-1 text-3xl font-bold text-emerald-400">Calculadoras</h1>

      <Card title="Seus dados">
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(['m', 'f'] as const).map((s) => (
            <button
              key={s}
              onClick={() => chooseSex(s)}
              className={`rounded-xl py-3 font-bold ${
                sex === s ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {s === 'm' ? 'Masculino' : 'Feminino'}
            </button>
          ))}
        </div>
        <Field
          label="Idade"
          unit="anos"
          value={ageText}
          onChange={(v) => {
            setAgeText(v)
            const n = num(v)
            if (n) saveProfile({ age: n })
          }}
        />
        <Field
          label="Altura"
          unit="cm"
          value={heightText}
          onChange={(v) => {
            setHeightText(v)
            const n = num(v)
            if (n) saveProfile({ heightCm: n })
          }}
        />
        <Field label="Peso" unit="kg" value={weightText} onChange={setWeightText} fill={weightFill} />
      </Card>

      <Card title="IMC">
        {imc ? (
          <Result>
            <div className="text-3xl font-bold text-emerald-400">{fmt(imc)}</div>
            <div className="text-sm text-slate-300">{bmiCategory(imc)}</div>
          </Result>
        ) : (
          <p className="text-sm text-slate-400">Preencha altura e peso acima.</p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          O IMC não separa músculo de gordura; para quem treina, olhe também a gordura corporal.
        </p>
      </Card>

      <Card title="Gordura corporal">
        <Field
          label="Pescoço"
          unit="cm"
          value={neckText}
          onChange={(v) => {
            setNeckText(v)
            const n = num(v)
            if (n) saveProfile({ neckCm: n })
          }}
        />
        <Field
          label="Cintura (na altura do umbigo)"
          unit="cm"
          value={waistText}
          onChange={setWaistText}
          fill={lastWaist ? { text: `Último: ${fmt(lastWaist)}`, value: String(lastWaist).replace('.', ',') } : undefined}
        />
        {sex === 'f' && (
          <Field
            label="Quadril"
            unit="cm"
            value={hipsText}
            onChange={setHipsText}
            fill={lastHips ? { text: `Último: ${fmt(lastHips)}`, value: String(lastHips).replace('.', ',') } : undefined}
          />
        )}
        {navy !== null && (
          <Result>
            <div className="text-3xl font-bold text-emerald-400">{fmt(navy)}%</div>
            <div className="text-sm text-slate-300">
              {bodyFatCategory(sex, navy)} · método da Marinha dos EUA
            </div>
          </Result>
        )}
        {navy === null && estimate !== null && (
          <Result>
            <div className="text-3xl font-bold text-emerald-400">≈ {fmt(Math.max(estimate, 3))}%</div>
            <div className="text-sm text-slate-300">
              Estimativa pelo IMC e idade (menos precisa). Preencha pescoço e cintura para o método
              da Marinha.
            </div>
          </Result>
        )}
        {navy === null && estimate === null && (
          <p className="text-sm text-slate-400">
            Preencha altura, pescoço e cintura (e quadril, no feminino).
          </p>
        )}
      </Card>

      <Card title="1RM (carga máxima)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Carga" unit="kg" value={liftText} onChange={setLiftText} />
          <Field label="Repetições" value={repsText} onChange={setRepsText} />
        </div>
        {oneRm ? (
          <>
            <Result>
              <div className="text-3xl font-bold text-emerald-400">{fmt(oneRm.average)} kg</div>
              <div className="text-sm text-slate-300">
                Epley {fmt(oneRm.epley)}
                {oneRm.brzycki !== null && ` · Brzycki ${fmt(oneRm.brzycki)}`} · Lombardi{' '}
                {fmt(oneRm.lombardi)}
              </div>
            </Result>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
              {repsTable(oneRm.average).map((r) => (
                <div key={r.reps} className="rounded-lg bg-slate-900 p-2">
                  <div className="text-slate-400">{r.reps} rep</div>
                  <div className="font-bold text-slate-100">{fmt(r.weight)}</div>
                  <div className="text-slate-500">{Math.round(r.percent)}%</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">Digite a carga e as repetições (de 1 a 30).</p>
        )}
      </Card>

      <Card title="Água por dia">
        <Field label="Treino por dia" unit="min" value={minutesText} onChange={setMinutesText} />
        <button
          onClick={() => setHot((h) => !h)}
          className={`mb-3 w-full rounded-xl py-3 font-bold ${
            hot ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'
          }`}
        >
          {hot ? '✓ Dia quente (+500 ml)' : 'Dia quente? Toque para somar +500 ml'}
        </button>
        {water ? (
          <Result>
            <div className="text-3xl font-bold text-emerald-400">{fmt(water / 1000, 2)} litros</div>
            <div className="text-sm text-slate-300">
              Cerca de {Math.round(water / 250)} copos de 250 ml
            </div>
          </Result>
        ) : (
          <p className="text-sm text-slate-400">Preencha o peso em "Seus dados".</p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Orientação geral. Com doença renal ou cardíaca, ou se um médico limitou líquidos, siga a
          orientação dele.
        </p>
      </Card>
    </div>
  )
}