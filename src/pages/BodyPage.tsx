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
import { BODY_FIELDS, seriesFor } from '../db/body'
import type { BodyEntry, BodyKey } from '../types'
import { formatDate, formatKg } from '../utils/format'
import { newId } from '../utils/id'
import BodyEntryForm from '../components/BodyEntryForm'
import Modal from '../components/Modal'
import ProgressTabs from '../components/ProgressTabs'
import BodyInsights from '../components/BodyInsights'
import { ChevronIcon } from '../components/SettingsIcons'

export default function BodyPage() {
  const entries = useLiveQuery(() => db.bodyEntries.toArray())
  const [metric, setMetric] = useState<BodyKey>('weight')
  const [editing, setEditing] = useState<BodyEntry | 'new' | null>(null)

  const list = [...(entries ?? [])].sort((a, b) => b.date - a.date)
  const available = BODY_FIELDS.filter((f) => list.some((e) => e[f.key] !== undefined))
  const current: BodyKey = available.some((f) => f.key === metric)
    ? metric
    : (available[0]?.key ?? 'weight')
  const field = BODY_FIELDS.find((f) => f.key === current) ?? BODY_FIELDS[0]

  const points = seriesFor(list, current)
  const first = points[0]
  const last = points[points.length - 1]
  const diff = first && last && points.length > 1 ? last.value - first.value : null

  async function handleSave(data: Omit<BodyEntry, 'id'>) {
    const id = editing && editing !== 'new' ? editing.id : newId()
    await db.bodyEntries.put({ id, ...data })
    setEditing(null)
  }

  async function handleDelete() {
    if (!editing || editing === 'new') return
    if (window.confirm('Excluir este registro?')) {
      await db.bodyEntries.delete(editing.id)
      setEditing(null)
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl font-bold text-emerald-400">Progresso</h1>
      <ProgressTabs />
      <BodyInsights entries={list} />

      {entries && list.length === 0 && (
        <div className="py-10 text-center">
          <p className="mb-1 text-lg font-semibold text-slate-50">Nenhum registro ainda</p>
          <p className="text-slate-400">
            Toque em "+ Registrar" para anotar o seu peso e as suas medidas.
          </p>
        </div>
      )}

      {list.length > 0 && (
        <>
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {available.map((f) => (
              <button
                key={f.key}
                onClick={() => setMetric(f.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  current === f.key ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {last && (
            <div className="mb-4 rounded-2xl bg-slate-800 p-4">
              <div className="text-sm text-slate-400">
                {field.label} mais recente ({formatDate(last.date)})
              </div>
              <div className="mt-1 text-4xl font-bold text-slate-50">
                {formatKg(last.value)}{' '}
                <span className="text-xl font-medium text-slate-400">{field.unit}</span>
              </div>
              {diff !== null && first && (
                <div className="mt-1 text-sm text-slate-400">
                  {diff > 0 ? '▲ +' : diff < 0 ? '▼ −' : '= '}
                  {formatKg(Math.abs(diff))} {field.unit} desde {formatDate(first.date)}
                </div>
              )}
            </div>
          )}

          <div className="mb-2 rounded-2xl bg-slate-800 p-3">
            {points.length < 2 && (
              <p className="mb-2 text-center text-sm text-slate-400">
                Com 2 ou mais registros desta medida o gráfico mostra a linha de evolução.
              </p>
            )}
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={points} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#36344f" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#918fa9" fontSize={12} />
                  <YAxis stroke="#918fa9" fontSize={12} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      background: '#181629',
                      border: '1px solid #36344f',
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: '#918fa9' }}
                    formatter={(value) => [`${formatKg(Number(value))} ${field.unit}`, '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#60a5fa"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#60a5fa' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Registros
          </h2>
          <ul className="divide-y divide-slate-700/60 pb-20">
            {list.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setEditing(e)}
                  className="flex w-full items-center gap-3 py-3.5 text-left active:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-slate-50">
                      {formatDate(e.date)}
                    </span>
                    <span className="block text-sm text-slate-400">
                      {BODY_FIELDS.filter((f) => e[f.key] !== undefined)
                        .map((f) => `${f.label} ${formatKg(e[f.key] ?? 0)} ${f.unit}`)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-slate-500">
                    <ChevronIcon />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <button
        onClick={() => setEditing('new')}
        className="fixed right-4 rounded-full bg-emerald-500 px-6 py-4 text-lg font-bold text-white shadow-lg active:opacity-80"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        + Registrar
      </button>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Novo registro' : 'Editar registro'}
          onClose={() => setEditing(null)}
        >
          <BodyEntryForm
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