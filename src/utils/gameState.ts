import type { Session } from '../types'
import { RPG_EVENT } from './rpg'

const KEY = 'fitflow-game'

export const START_ENERGY = 20
export const ENERGY_PER_SET = 1
export const ENERGY_PER_SESSION = 3
export const MAX_POTIONS = 9

export interface GameState {
  startedAt: number // a energia só conta treinos feitos depois daqui
  energySpent: number
  gold: number
  potions: number
  clears: Record<string, number> // vezes que cada dungeon foi concluída
  wins: number
  kills: number
  owned: string[] // ids dos itens comprados
  equipped: Record<string, string> // espaço (weapon/armor/charm) -> id do item
  history: HistoryItem[] // últimas corridas, da mais nova para a mais antiga
  bonusDay: string // dia (aaaa-mm-dd) em que o bônus diário foi usado
  towerBest: number // andar mais alto já vencido na Torre Infinita
}

export interface HistoryItem {
  at: number
  dungeonId: string
  won: boolean
  gold: number
  kills: number
  floor?: number // só na Torre: andar mais alto que você venceu
}

export const DAILY_BONUS = 1.5
const MAX_HISTORY = 30

export function todayKey(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

function notify(): void {
  try {
    window.dispatchEvent(new Event(RPG_EVENT))
  } catch {
    // sem janela, tudo bem
  }
}

/** Valida um objeto qualquer (do armazenamento ou de um backup) e devolve um jogo seguro, ou null. */
export function sanitizeGame(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null
  const g = raw as Partial<GameState>
  const history: HistoryItem[] = Array.isArray(g.history)
    ? g.history
        .filter((h): h is HistoryItem => !!h && typeof h === 'object' && typeof h.dungeonId === 'string')
        .map((h) => ({
          at: Number(h.at) || 0,
          dungeonId: h.dungeonId,
          won: Boolean(h.won),
          gold: Number(h.gold) || 0,
          kills: Number(h.kills) || 0,
          ...(Number(h.floor) > 0 ? { floor: Number(h.floor) } : {}),
        }))
        .slice(0, MAX_HISTORY)
    : []
  return {
    startedAt: Number(g.startedAt) || Date.now(),
    energySpent: Number(g.energySpent) || 0,
    gold: Number(g.gold) || 0,
    potions: Math.min(MAX_POTIONS, Number(g.potions) || 0),
    clears: g.clears && typeof g.clears === 'object' ? g.clears : {},
    wins: Number(g.wins) || 0,
    kills: Number(g.kills) || 0,
    owned: Array.isArray(g.owned) ? g.owned.filter((x): x is string => typeof x === 'string') : [],
    equipped: g.equipped && typeof g.equipped === 'object' ? g.equipped : {},
    history,
    bonusDay: typeof g.bonusDay === 'string' ? g.bonusDay : '',
    towerBest: Math.max(0, Math.floor(Number(g.towerBest) || 0)),
  }
}

export function getGame(): GameState | null {
  try {
    return sanitizeGame(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return null
  }
}

export function saveGame(g: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(g))
  } catch {
    // sem armazenamento, sem problema
  }
  notify()
}

/** Cria o jogo na primeira vez que a aba Aventura é aberta. */
export function ensureGame(): GameState {
  const existing = getGame()
  if (existing) return existing
  const fresh: GameState = {
    startedAt: Date.now(),
    energySpent: 0,
    gold: 0,
    potions: 2,
    clears: {},
    wins: 0,
    kills: 0,
    owned: [],
    equipped: {},
    history: [],
    bonusDay: '',
    towerBest: 0,
  }
  saveGame(fresh)
  return fresh
}

/** Energia ganha: um presente inicial + treinos feitos depois que o jogo começou. */
export function energyAvailable(
  game: GameState,
  finished: Session[],
  setsBySession: Map<string, number>,
): number {
  let earned = START_ENERGY
  for (const s of finished) {
    if ((s.finishedAt ?? s.startedAt) < game.startedAt) continue
    const sets = setsBySession.get(s.id) ?? 0
    if (sets > 0) earned += sets * ENERGY_PER_SET + ENERGY_PER_SESSION
  }
  return Math.max(0, earned - game.energySpent)
}

export function spendEnergy(game: GameState, amount: number): GameState {
  const next = { ...game, energySpent: game.energySpent + amount }
  saveGame(next)
  return next
}

export interface RunResult {
  dungeonId: string
  won: boolean
  gold: number // ouro juntado na corrida
  firstClearGold: number
  potionsLeft: number // poções que sobraram (já contando as achadas)
  kills: number
  towerFloor?: number // só na Torre: andar mais alto vencido nesta subida
}

export interface RunOutcome {
  game: GameState
  gold: number // ouro que entrou na carteira
  firstClear: boolean
  dailyBonus: boolean
  newRecord: boolean
}

/**
 * Guarda o resultado da corrida. Quem perde fica com metade do ouro.
 * A primeira vitória de cada dia rende 50% a mais.
 */
export function finishRun(game: GameState, r: RunResult): RunOutcome {
  const tower = r.dungeonId === 'T'
  const firstClear = !tower && r.won && (game.clears[r.dungeonId] ?? 0) === 0
  let gold = r.won ? r.gold + (firstClear ? r.firstClearGold : 0) : Math.floor(r.gold / 2)
  const today = todayKey()
  const dailyBonus = r.won && game.bonusDay !== today
  if (dailyBonus) gold = Math.round(gold * DAILY_BONUS)
  const reached = r.towerFloor ?? 0
  const newRecord = tower && reached > game.towerBest
  const item: HistoryItem = {
    at: Date.now(),
    dungeonId: r.dungeonId,
    won: r.won,
    gold,
    kills: r.kills,
    ...(tower && reached > 0 ? { floor: reached } : {}),
  }
  const next: GameState = {
    ...game,
    gold: game.gold + gold,
    potions: Math.min(MAX_POTIONS, Math.max(0, r.potionsLeft)),
    clears: r.won && !tower ? { ...game.clears, [r.dungeonId]: (game.clears[r.dungeonId] ?? 0) + 1 } : game.clears,
    wins: game.wins + (r.won && !tower ? 1 : 0),
    kills: game.kills + r.kills,
    history: [item, ...game.history].slice(0, MAX_HISTORY),
    bonusDay: dailyBonus ? today : game.bonusDay,
    towerBest: newRecord ? reached : game.towerBest,
  }
  saveGame(next)
  return { game: next, gold, firstClear, dailyBonus, newRecord }
}