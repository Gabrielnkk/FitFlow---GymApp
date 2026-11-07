// made by: Gabriel Mattos
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { db } from '../db/database'
import { buildPoints, buildRecords, buildSummaries } from '../db/progress'
import { formatDate, formatKg } from '../utils/format'
import { buildBaselines } from '../utils/rpe'
import { paddedDomain } from '../utils/chartDomain'
import ProgressTabs from '../components/ProgressTabs'
import { ChevronIcon } from '../components/SettingsIcons'

type Metric = 'maxWeight' | 'volume' | 'maxSeconds' | 'totalSeconds'

const REPS_OPTIONS: readonly (readonly [Metric, string])[] = [
  ['maxWeight', 'Carga máxima'],
  ['volume', 'Volume'],
]
const TIME_OPTIONS: readonly (readonly [Metric, string])[] = [
  ['maxSeconds', 'Melhor tempo'],
  ['totalSeconds', 'Tempo total'],
]
const UNITS: Record<Metric, string> = {
  maxWeight: 'kg',
  volume: 'kg (volume)',
  maxSeconds: 's',
  totalSeconds: 's',
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </h2>
  )
}

function StatRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3.5">
      <span className="min-w-0">
        <span className="block text-base text-slate-200">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
      <span className="shrink-0 text-lg font-bold text-slate-50">{value}</span>
    </li>
  )
}

export default function ProgressPage() {
  const finished = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray())
  const [selected, setSelected] = useState<string>('')
  const [chosenMetric, setChosenMetric] = useState<Metric>('maxWeight')

  if (!finished) return <div className="p-4 text-slate-400">Carregando...</div>

  const summaries = buildSummaries(finished)

  if (summaries.length === 0) {
    return (
      <div className="p-4">
        <h1 className="mb-4 text-3xl font-bold text-emerald-400">Progresso</h1>
        <ProgressTabs />
        <div className="py-10 text-center">
          <p className="mb-1 text-lg font-semibold text-slate-50">Ainda sem dados</p>
          <p className="text-slate-400">
            Finalize alguns treinos e a sua evolução aparece aqui.
          </p>
        </div>
      </div>
    )
  }

  const currentId = summaries.some((s) => s.exerciseId === selected)
    ? selected
    : summaries[0].exerciseId
  const isTime = summaries.find((s) => s.exerciseId === currentId)?.isTime ?? false
  const options = isTime ? TIME_OPTIONS : REPS_OPTIONS
  const metric: Metric = options.some(([key]) => key === chosenMetric)
    ? chosenMetric
    : options[0][0]

  const points = buildPoints(finished, currentId)
  const records = buildRecords(finished, currentId)
  const oneRm = buildBaselines(finished).get(currentId)
  const bestTotal = points.reduce((m, p) => Math.max(m, p.totalSeconds), 0)

  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl font-bold text-emerald-400">Progresso</h1>
      <ProgressTabs />
      <label className="mb-3 block">
        <span className="mb-1 block text-sm text-slate-400">Exercício</span>
        <select
          className="w-full rounded-xl bg-slate-800 px-4 py-3 text-base text-slate-50 outline-none"
          value={currentId}
          onChange={(e) => setSelected(e.target.value)}
        >
          {summaries.map((s) => (
            <option key={s.exerciseId} value={s.exerciseId}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-800 p-1">
        {options.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setChosenMetric(key)}
            className={`rounded-lg py-2.5 text-base font-semibold ${
              metric === key ? 'bg-emerald-500 text-white' : 'text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-2 rounded-2xl bg-slate-800 p-3">
        {points.length < 2 && (
          <p className="mb-2 text-center text-sm text-slate-400">
            Com 2 ou mais treinos deste exercício o gráfico mostra a linha de evolução.
          </p>
        )}
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={points} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#36344f" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#918fa9" fontSize={12} />
              <YAxis
                stroke="#918fa9"
                fontSize={12}
                domain={(range) =>
                  paddedDomain(metric === 'maxWeight' ? 'kg' : 'relative', range)
                }
              />
              <Tooltip
                contentStyle={{
                  background: '#181629',
                  border: '1px solid #36344f',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#918fa9' }}
                formatter={(value) => [`${formatKg(Number(value))} ${UNITS[metric]}`, '']}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#60a5fa"
                strokeWidth={3}
                dot={{ r: 5, fill: '#60a5fa' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle>Recordes deste exercício</SectionTitle>
      <ul className="divide-y divide-slate-700/60">
        {isTime ? (
          <>
            <StatRow label="Melhor tempo em uma série" value={`${records.bestSeconds} s`} />
            <StatRow label="Maior tempo total em um treino" value={`${bestTotal} s`} />
          </>
        ) : (
          <>
            <StatRow
              label="Maior carga"
              value={`${formatKg(records.maxWeight)} kg`}
              hint={records.maxWeightDate ? formatDate(records.maxWeightDate) : undefined}
            />
            <StatRow
              label="Mais repetições em uma série"
              value={`${records.bestReps} reps`}
              hint={`com ${formatKg(records.bestRepsWeight)} kg`}
            />
            <StatRow label="Maior volume em um treino" value={`${formatKg(records.bestVolume)} kg`} />
            <StatRow
              label="1RM estimado"
              hint="fórmula de Epley"
              value={oneRm ? `${formatKg(Math.round(oneRm * 10) / 10)} kg` : '—'}
            />
          </>
        )}
      </ul>

      <SectionTitle>Todos os exercícios</SectionTitle>
      <ul className="divide-y divide-slate-700/60">
        {summaries.map((s) => (
          <li key={s.exerciseId}>
            <button
              onClick={() => {
                setSelected(s.exerciseId)
                window.scrollTo({ top: 0 })
              }}
              className="flex w-full items-center gap-3 py-3.5 text-left active:opacity-60"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-medium text-slate-50">
                  {s.name}
                </span>
                <span className="block text-sm text-slate-400">
                  {s.isTime
                    ? `Melhor: ${s.records.bestSeconds} s`
                    : `PR: ${formatKg(s.records.maxWeight)} kg`}{' '}
                  · {s.sessions} {s.sessions === 1 ? 'treino' : 'treinos'}
                </span>
              </span>
              <span className="shrink-0 text-slate-500">
                <ChevronIcon />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}