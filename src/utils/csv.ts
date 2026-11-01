import { buildBackup } from '../db/backup'
import { BODY_FIELDS, dateToInput } from '../db/body'
import { kindLabel } from './sets'

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = typeof value === 'number' ? String(value).replace('.', ',') : value
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(rows: (string | number | null | undefined)[][]): string {
  // \uFEFF faz o Excel reconhecer os acentos
  return '\uFEFF' + rows.map((r) => r.map(cell).join(';')).join('\r\n')
}

export async function sessionsCsv(): Promise<string> {
  const { sessions } = await buildBackup()
  const rows: (string | number | null | undefined)[][] = [
    ['Data', 'Treino', 'Exercício', 'Série', 'Tipo', 'Carga (kg)', 'Reps', 'Segundos', 'RPE'],
  ]
  const finished = sessions.filter((s) => s.status === 'finished').sort((a, b) => a.startedAt - b.startedAt)
  for (const s of finished) {
    for (const ex of s.exercises) {
      ex.sets.forEach((set, i) => {
        if (!set.done) return
        rows.push([
          dateToInput(s.startedAt),
          s.name,
          ex.exerciseName,
          i + 1,
          kindLabel(set.kind) ?? 'Normal',
          set.weight,
          set.reps,
          set.seconds ?? '',
          set.rpe ?? '',
        ])
      })
    }
  }
  return toCsv(rows)
}

export async function bodyCsv(): Promise<string> {
  const { bodyEntries } = await buildBackup()
  const rows: (string | number | null | undefined)[][] = [
    ['Data', ...BODY_FIELDS.map((f) => f.label)],
  ]
  const sorted = [...(bodyEntries ?? [])].sort((a, b) => a.date - b.date)
  for (const e of sorted) {
    rows.push([dateToInput(e.date), ...BODY_FIELDS.map((f) => e[f.key] ?? '')])
  }
  return toCsv(rows)
}