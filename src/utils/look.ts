import { RPG_EVENT } from './rpg'

const KEY = 'fitflow-look'

export interface Look {
  body: 'm' | 'f'
  skin: number
  hairStyle: number
  hairColor: number
  shirt: number
  bottom: number // 0 calça, 1 shorts, 2 saia
  bottomColor: number
}

export const SKINS = ['#fde2c8', '#fcd5b0', '#e8b48a', '#c68642', '#8d5524', '#5c3a21']
export const HAIR_COLORS = ['#3b2a24', '#111827', '#a16207', '#fbbf24', '#b91c1c', '#9ca3af', '#7c3aed', '#0ea5e9']
export const SHIRTS = ['#64748b', '#ef4444', '#f97316', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899']
export const BOTTOM_COLORS = ['#334155', '#111827', '#1e3a8a', '#78350f', '#166534', '#cbd5e1']
export const HAIR_STYLES = ['Espetado', 'Curto', 'Longo', 'Rabo de cavalo', 'Coque', 'Trança']
export const BOTTOM_STYLES = ['Calça', 'Shorts', 'Saia']

export const DEFAULT_LOOK: Look = {
  body: 'm',
  skin: 1,
  hairStyle: 0,
  hairColor: 0,
  shirt: 0,
  bottom: 0,
  bottomColor: 0,
}

const inRange = (v: unknown, max: number, fallback: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < max ? v : fallback

export function sanitizeLook(raw: unknown): Look {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Look>
  return {
    body: r.body === 'f' ? 'f' : 'm',
    skin: inRange(r.skin, SKINS.length, DEFAULT_LOOK.skin),
    hairStyle: inRange(r.hairStyle, HAIR_STYLES.length, DEFAULT_LOOK.hairStyle),
    hairColor: inRange(r.hairColor, HAIR_COLORS.length, DEFAULT_LOOK.hairColor),
    shirt: inRange(r.shirt, SHIRTS.length, DEFAULT_LOOK.shirt),
    bottom: inRange(r.bottom, BOTTOM_STYLES.length, DEFAULT_LOOK.bottom),
    bottomColor: inRange(r.bottomColor, BOTTOM_COLORS.length, DEFAULT_LOOK.bottomColor),
  }
}

export function getLook(): Look {
  try {
    return sanitizeLook(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return DEFAULT_LOOK
  }
}

export function saveLook(look: Look): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(look))
  } catch {
    // sem armazenamento, sem problema
  }
  try {
    window.dispatchEvent(new Event(RPG_EVENT))
  } catch {
    // sem janela, tudo bem
  }
}

/** Escurece uma cor #rrggbb (usado para sombras de pele e roupa). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))))
  const r = f((n >> 16) & 255)
  const g = f((n >> 8) & 255)
  const b = f(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}