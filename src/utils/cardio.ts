import type { CardioLevel } from '../types'

export const CARDIO_LEVELS: { value: CardioLevel; label: string }[] = [
  { value: 'warmup', label: 'Aquecimento' },
  { value: 'easy', label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'hard', label: 'Intenso' },
  { value: 'interval', label: 'Intervalado' },
  { value: 'cooldown', label: 'Desaquecimento' },
]

export function cardioLabel(level: CardioLevel | undefined): string | null {
  if (!level) return null
  return CARDIO_LEVELS.find((c) => c.value === level)?.label ?? null
}