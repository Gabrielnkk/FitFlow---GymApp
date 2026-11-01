import type { BodyEntry, BodyKey } from '../types'

export const BODY_FIELDS: { key: BodyKey; label: string; unit: string }[] = [
  { key: 'weight', label: 'Peso', unit: 'kg' },
  { key: 'bodyFat', label: '% de gordura', unit: '%' },
  { key: 'waist', label: 'Cintura', unit: 'cm' },
  { key: 'chest', label: 'Peito', unit: 'cm' },
  { key: 'arm', label: 'Braço', unit: 'cm' },
  { key: 'thigh', label: 'Coxa', unit: 'cm' },
  { key: 'hips', label: 'Quadril', unit: 'cm' },
  { key: 'calf', label: 'Panturrilha', unit: 'cm' },
]

// "2026-10-27" vira meio-dia local desse dia (evita problemas de fuso e horário de verão)
export function dateFromInput(value: string): number {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 12).getTime()
}

export function dateToInput(ms: number): string {
  const d = new Date(ms)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export interface BodyPoint {
  date: number
  label: string // data curta para o eixo, ex.: "27/10"
  value: number
}

// Pontos do gráfico de uma medida, do mais antigo para o mais novo
export function seriesFor(entries: BodyEntry[], key: BodyKey): BodyPoint[] {
  return entries
    .filter((e) => e[key] !== undefined)
    .sort((a, b) => a.date - b.date)
    .map((e) => ({
      date: e.date,
      label: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: e[key] ?? 0,
    }))
}