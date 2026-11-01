import type { SetKind } from '../types'

export const SET_KINDS: { value: SetKind; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'Aquecimento' },
  { value: 'failure', label: 'Falha' },
  { value: 'drop', label: 'Drop set' },
]

// Aquecimento não entra em volume, recordes, 1RM nem RPE
export function isWorkingSet(set: { kind?: SetKind }): boolean {
  return set.kind !== 'warmup'
}

export function kindLabel(kind: SetKind | undefined): string | null {
  if (!kind || kind === 'normal') return null
  return SET_KINDS.find((k) => k.value === kind)?.label ?? null
}