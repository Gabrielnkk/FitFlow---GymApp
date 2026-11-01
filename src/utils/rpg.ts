import type { Stats } from './rpgStats'
import { ACHIEVEMENTS, ACHIEVEMENT_XP, isUnlocked } from './achievements'

export const RPG_EVENT = 'fitflow-rpg-change'
const NAME_KEY = 'fitflow-rpg-name'
const SEEN_KEY = 'fitflow-rpg-seen-level'
const CLAIMED_KEY = 'fitflow-rpg-claimed'

function notify(): void {
  try {
    window.dispatchEvent(new Event(RPG_EVENT))
  } catch {
    // sem janela, tudo bem
  }
}

// ---------- Dados guardados no aparelho ----------
export function getName(): string {
  try {
    return localStorage.getItem(NAME_KEY)?.trim() || 'Atleta'
  } catch {
    return 'Atleta'
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 20))
  } catch {
    // sem armazenamento, sem problema
  }
  notify()
}

export function getSeenLevel(): number | null {
  try {
    const n = Number(localStorage.getItem(SEEN_KEY))
    return n >= 1 ? n : null
  } catch {
    return null
  }
}

export function setSeenLevel(level: number): void {
  try {
    localStorage.setItem(SEEN_KEY, String(level))
  } catch {
    // sem armazenamento, sem problema
  }
}

export function resetSeenLevel(): void {
  try {
    localStorage.removeItem(SEEN_KEY)
  } catch {
    // sem armazenamento, sem problema
  }
}

/** Missões já resgatadas: id da missão -> XP que ela deu. */
export function getClaimed(): Record<string, number> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(CLAIMED_KEY) ?? 'null')
    if (raw && typeof raw === 'object') return raw as Record<string, number>
  } catch {
    // sem dados salvos
  }
  return {}
}

export function setClaimed(all: Record<string, number>): void {
  try {
    localStorage.setItem(CLAIMED_KEY, JSON.stringify(all))
  } catch {
    // sem armazenamento, sem problema
  }
  notify()
}

export function claimMission(id: string, xp: number): void {
  const all = getClaimed()
  if (all[id] !== undefined) return
  all[id] = xp
  setClaimed(all)
}

export function getWeeklyGoal(): number {
  try {
    const n = Number(localStorage.getItem('fitflow-weekly-goal'))
    return n >= 1 && n <= 7 ? Math.round(n) : 3
  } catch {
    return 3
  }
}

// ---------- Níveis e ranks ----------
/** XP total necessário para chegar ao nível `level`. */
/** XP total necessário para chegar a um nível (curva mais lenta: cada nível pede mais que o anterior). */
export function xpForLevel(level: number): number {
  return (level - 1) * (180 + 30 * level)
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  return level
}

export interface Rank {
  min: number
  letter: string
  title: string
  color: string
}

export const RANKS: Rank[] = [
  { min: 1, letter: 'E', title: 'Novato', color: '#94a3b8' },
  { min: 10, letter: 'D', title: 'Aprendiz', color: '#34d399' },
  { min: 20, letter: 'C', title: 'Guerreiro', color: '#60a5fa' },
  { min: 30, letter: 'B', title: 'Veterano', color: '#a78bfa' },
  { min: 45, letter: 'A', title: 'Elite', color: '#fbbf24' },
  { min: 60, letter: 'S', title: 'Lenda', color: '#f472b6' },
]

export function rankIndexFor(level: number): number {
  let idx = 0
  RANKS.forEach((r, i) => {
    if (level >= r.min) idx = i
  })
  return idx
}

// ---------- Personagem ----------
export interface Attribute {
  key: string
  label: string
  hint: string
  value: number
  color: string
}

export interface Character {
  level: number
  rankIndex: number
  rank: Rank
  totalXp: number
  intoLevel: number
  needed: number
  pct: number
  baseXp: number
  achievementXp: number
  missionXp: number
  unlocked: number
  attributes: Attribute[]
}

export function buildCharacter(stats: Stats, claimed: Record<string, number>): Character {
  const unlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a, stats)).length
  const achievementXp = unlocked * ACHIEVEMENT_XP
  const missionXp = Object.values(claimed).reduce((t, v) => t + (Number(v) || 0), 0)
  const totalXp = stats.baseXp + achievementXp + missionXp

  const level = levelFromXp(totalXp)
  const floor = xpForLevel(level)
  const needed = xpForLevel(level + 1) - floor
  const intoLevel = totalXp - floor
  const rankIndex = rankIndexFor(level)

  const attributes: Attribute[] = [
    { key: 'str', label: 'Força', hint: 'cresce com recordes', value: 5 + stats.prs * 3, color: '#f87171' },
    { key: 'end', label: 'Resistência', hint: 'cresce com o volume levantado', value: 5 + Math.floor(stats.volume / 1000), color: '#fbbf24' },
    { key: 'dis', label: 'Disciplina', hint: 'cresce com treinos e semanas na meta', value: 5 + stats.sessions * 2 + stats.weeksOnGoal * 5, color: '#60a5fa' },
    { key: 'vit', label: 'Vitalidade', hint: 'cresce com dieta e cardio', value: 5 + stats.dietDays * 3 + stats.dietLogDays + stats.cardioSets, color: '#34d399' },
  ]

  return {
    level,
    rankIndex,
    rank: RANKS[rankIndex],
    totalXp,
    intoLevel,
    needed,
    pct: Math.min(100, Math.round((intoLevel / needed) * 100)),
    baseXp: stats.baseXp,
    achievementXp,
    missionXp,
    unlocked,
    attributes,
  }
}