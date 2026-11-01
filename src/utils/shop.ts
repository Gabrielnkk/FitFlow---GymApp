import type { GearBonus } from './battle'
import { MAX_POTIONS, saveGame, type GameState } from './gameState'

export type Slot = 'weapon' | 'armor' | 'charm'

export interface Item {
  id: string
  slot: Slot
  name: string
  icon: string
  price: number
  bonus: Partial<GearBonus>
}

export const SLOTS: { id: Slot; label: string }[] = [
  { id: 'weapon', label: 'Arma' },
  { id: 'armor', label: 'Armadura' },
  { id: 'charm', label: 'Amuleto' },
]

export const POTION_PRICE = 30

export const ITEMS: Item[] = [
  { id: 'w1', slot: 'weapon', name: 'Adaga de Ferro', icon: '🗡', price: 80, bonus: { atk: 3 } },
  { id: 'w2', slot: 'weapon', name: 'Espada de Aço', icon: '⚔', price: 220, bonus: { atk: 7 } },
  { id: 'w3', slot: 'weapon', name: 'Lâmina Rúnica', icon: '🔪', price: 500, bonus: { atk: 12 } },
  { id: 'w4', slot: 'weapon', name: 'Espada Lendária', icon: '✨', price: 1100, bonus: { atk: 19 } },
  { id: 'w5', slot: 'weapon', name: 'Lâmina do Dragão', icon: '🐉', price: 2200, bonus: { atk: 28 } },
  { id: 'w6', slot: 'weapon', name: 'Espada Celestial', icon: '🌟', price: 4500, bonus: { atk: 40 } },
  { id: 'a1', slot: 'armor', name: 'Túnica de Couro', icon: '🥋', price: 80, bonus: { def: 2, hp: 10 } },
  { id: 'a2', slot: 'armor', name: 'Cota de Malha', icon: '⛓', price: 220, bonus: { def: 4, hp: 25 } },
  { id: 'a3', slot: 'armor', name: 'Armadura de Placas', icon: '🛡', price: 500, bonus: { def: 7, hp: 45 } },
  { id: 'a4', slot: 'armor', name: 'Armadura Sagrada', icon: '👑', price: 1100, bonus: { def: 11, hp: 70 } },
  { id: 'a5', slot: 'armor', name: 'Armadura de Dragão', icon: '🐲', price: 2200, bonus: { def: 16, hp: 100 } },
  { id: 'a6', slot: 'armor', name: 'Manto Celestial', icon: '🌌', price: 4500, bonus: { def: 22, hp: 140 } },
  { id: 'c1', slot: 'charm', name: 'Amuleto da Sorte', icon: '🍀', price: 80, bonus: { crit: 3, dodge: 2 } },
  { id: 'c2', slot: 'charm', name: 'Anel Veloz', icon: '💍', price: 220, bonus: { crit: 6, dodge: 4 } },
  { id: 'c3', slot: 'charm', name: 'Talismã Arcano', icon: '🔮', price: 500, bonus: { crit: 9, dodge: 7 } },
  { id: 'c4', slot: 'charm', name: 'Coroa do Caçador', icon: '💎', price: 1100, bonus: { crit: 13, dodge: 10 } },
  { id: 'c5', slot: 'charm', name: 'Olho do Dragão', icon: '👁', price: 2200, bonus: { crit: 17, dodge: 13 } },
  { id: 'c6', slot: 'charm', name: 'Estrela do Destino', icon: '☄', price: 4500, bonus: { crit: 21, dodge: 16 } },
]

export function itemById(id: string | undefined): Item | undefined {
  return ITEMS.find((i) => i.id === id)
}

/** Soma os bônus de tudo que está equipado. */
export function gearBonus(game: GameState): GearBonus {
  const total: GearBonus = { hp: 0, atk: 0, def: 0, crit: 0, dodge: 0 }
  for (const id of Object.values(game.equipped)) {
    const it = itemById(id)
    if (!it) continue
    total.hp += it.bonus.hp ?? 0
    total.atk += it.bonus.atk ?? 0
    total.def += it.bonus.def ?? 0
    total.crit += it.bonus.crit ?? 0
    total.dodge += it.bonus.dodge ?? 0
  }
  return total
}

export function bonusText(b: Partial<GearBonus>): string {
  const parts: string[] = []
  if (b.atk) parts.push(`+${b.atk} ataque`)
  if (b.def) parts.push(`+${b.def} defesa`)
  if (b.hp) parts.push(`+${b.hp} vida`)
  if (b.crit) parts.push(`+${b.crit}% crítico`)
  if (b.dodge) parts.push(`+${b.dodge}% esquiva`)
  return parts.join(' · ')
}

/** Compra e já equipa o item (se for melhor que nada ou igual espaço, troca). */
export function buyItem(game: GameState, id: string): GameState {
  const it = itemById(id)
  if (!it || game.owned.includes(id) || game.gold < it.price) return game
  const next: GameState = {
    ...game,
    gold: game.gold - it.price,
    owned: [...game.owned, id],
    equipped: { ...game.equipped, [it.slot]: id },
  }
  saveGame(next)
  return next
}

export function equipItem(game: GameState, id: string): GameState {
  const it = itemById(id)
  if (!it || !game.owned.includes(id)) return game
  const next = { ...game, equipped: { ...game.equipped, [it.slot]: id } }
  saveGame(next)
  return next
}

export function buyPotion(game: GameState): GameState {
  if (game.gold < POTION_PRICE || game.potions >= MAX_POTIONS) return game
  const next = { ...game, gold: game.gold - POTION_PRICE, potions: game.potions + 1 }
  saveGame(next)
  return next
}

export interface GearTiers {
  weapon: number
  armor: number
  charm: number
}

/** Nível (0 a 6) do que está equipado em cada espaço, para desenhar no personagem. */
export function gearTiers(game: GameState | null): GearTiers {
  const t = (slot: Slot) => {
    const id = game?.equipped[slot]
    return id ? Number(id.slice(1)) || 0 : 0
  }
  return { weapon: t('weapon'), armor: t('armor'), charm: t('charm') }
}