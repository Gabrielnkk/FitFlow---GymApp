import type { BodyEntry, BodyKey } from '../types'
import type { Sex } from './profile'

// ---------- IMC ----------
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return weightKg / (m * m)
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return 'Abaixo do peso'
  if (value < 25) return 'Peso normal'
  if (value < 30) return 'Sobrepeso'
  if (value < 35) return 'Obesidade grau I'
  if (value < 40) return 'Obesidade grau II'
  return 'Obesidade grau III'
}

// ---------- Gordura corporal ----------
// Método da Marinha dos EUA (medidas em cm). Quadril só é usado para mulheres.
export function bodyFatNavy(
  sex: Sex,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipsCm?: number,
): number | null {
  if (heightCm <= 0 || waistCm <= 0 || neckCm <= 0) return null
  let value: number
  if (sex === 'm') {
    if (waistCm <= neckCm) return null
    value =
      495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450
  } else {
    if (!hipsCm || hipsCm <= 0 || waistCm + hipsCm <= neckCm) return null
    value =
      495 /
        (1.29579 - 0.35004 * Math.log10(waistCm + hipsCm - neckCm) + 0.221 * Math.log10(heightCm)) -
      450
  }
  return Number.isFinite(value) && value > 0 && value < 70 ? value : null
}

// Estimativa pelo IMC (fórmula de Deurenberg): menos precisa que a da Marinha
export function bodyFatFromBmi(bmiValue: number, age: number, sex: Sex): number {
  return 1.2 * bmiValue + 0.23 * age - 10.8 * (sex === 'm' ? 1 : 0) - 5.4
}

export function bodyFatCategory(sex: Sex, percent: number): string {
  const limits = sex === 'm' ? [6, 14, 18, 25] : [14, 21, 25, 32]
  if (percent < limits[0]) return 'Gordura essencial (muito baixa)'
  if (percent < limits[1]) return 'Atlético'
  if (percent < limits[2]) return 'Em forma'
  if (percent < limits[3]) return 'Média'
  return 'Acima da média'
}

// ---------- 1RM ----------
export interface OneRmResult {
  epley: number
  brzycki: number | null
  lombardi: number
  average: number
}

export function oneRmFormulas(weight: number, reps: number): OneRmResult {
  if (reps === 1) return { epley: weight, brzycki: weight, lombardi: weight, average: weight }
  const epley = weight * (1 + reps / 30)
  const brzycki = reps < 37 ? (weight * 36) / (37 - reps) : null
  const lombardi = weight * Math.pow(reps, 0.1)
  const values = brzycki === null ? [epley, lombardi] : [epley, brzycki, lombardi]
  return { epley, brzycki, lombardi, average: values.reduce((a, b) => a + b, 0) / values.length }
}

// Carga estimada para 1 a 10 repetições, a partir do 1RM
export function repsTable(oneRm: number): { reps: number; weight: number; percent: number }[] {
  return Array.from({ length: 10 }, (_, i) => {
    const reps = i + 1
    const weight = reps === 1 ? oneRm : oneRm / (1 + reps / 30)
    return { reps, weight, percent: (weight / oneRm) * 100 }
  })
}

// ---------- Água ----------
// Base: 40 ml/kg até 29 anos, 35 ml/kg de 30 a 55, 30 ml/kg acima. Soma 500 ml por hora de treino.
export function waterMl(
  weightKg: number,
  age: number | undefined,
  trainingMinutes: number,
  hot: boolean,
): number {
  const perKg = age === undefined ? 35 : age < 30 ? 40 : age <= 55 ? 35 : 30
  const total = weightKg * perKg + (trainingMinutes / 60) * 500 + (hot ? 500 : 0)
  return Math.round(total / 50) * 50
}

// ---------- Dados do corpo ----------
// Valor mais recente de uma medida (peso, cintura...) nos registros
export function latestValue(entries: BodyEntry[], key: BodyKey): number | undefined {
  const sorted = [...entries].sort((a, b) => b.date - a.date)
  for (const e of sorted) {
    const v = e[key]
    if (v !== undefined) return v
  }
  return undefined
}

export function fmt(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',')
}