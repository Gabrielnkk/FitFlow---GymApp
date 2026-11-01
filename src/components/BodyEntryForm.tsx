import { useState } from 'react'
import { BODY_FIELDS, dateFromInput, dateToInput } from '../db/body'
import type { BodyEntry, BodyKey } from '../types'

interface Props {
  initial?: BodyEntry
  onSave: (data: Omit<BodyEntry, 'id'>) => void
  onDelete?: () => void
  onCancel: () => void
}

const inputClass =
  'w-full rounded-xl bg-slate-900 px-4 py-3 text-base text-slate-50 outline-none ring-1 ring-slate-600 focus:ring-emerald-400'

// Aceita vírgula ou ponto; vazio ou inválido vira "sem valor"
function parse(text: string): number | undefined {
  const n = parseFloat(text.trim().replace(',', '.'))
  return Number.isNaN(n) || n <= 0 ? undefined : n
}

export default function BodyEntryForm({ initial, onSave, onDelete, onCancel }: Props) {
  const [date, setDate] = useState(dateToInput(initial?.date ?? Date.now()))
  const [values, setValues] = useState<Record<BodyKey, string>>(() => {
    const start = {} as Record<BodyKey, string>
    for (const f of BODY_FIELDS) {
      const current = initial?.[f.key]
      start[f.key] = current !== undefined ? String(current).replace('.', ',') : ''
    }
    return start
  })
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) {
      setError('Escolha a data.')
      return
    }
    const data: Omit<BodyEntry, 'id'> = { date: dateFromInput(date) }
    let filled = 0
    for (const f of BODY_FIELDS) {
      const n = parse(values[f.key])
      if (n !== undefined) {
        data[f.key] = n
        filled++
      }
    }
    if (filled === 0) {
      setError('Preencha pelo menos um campo.')
      return
    }
    onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">Data</span>
        <input
          type="date"
          className={`${inputClass} [color-scheme:dark]`}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        {BODY_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm text-slate-300">
              {f.label} ({f.unit})
            </span>
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="—"
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </label>
        ))}
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-slate-700 py-4 text-lg font-semibold"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-emerald-500 py-4 text-lg font-semibold text-slate-900 active:bg-emerald-600"
        >
          Salvar
        </button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-xl py-3 text-base font-semibold text-red-400"
        >
          Excluir registro
        </button>
      )}
    </form>
  )
}