import type { Character } from './rpg'

// ---------- Seu personagem na batalha ----------
export interface PlayerStats {
  maxHp: number
  atk: number
  def: number
  crit: number // chance de golpe crítico, em %
  dodge: number // chance de desviar, em %
}

/** Transforma o personagem (nível e atributos do treino) em força de batalha. */
export interface GearBonus {
  hp: number
  atk: number
  def: number
  crit: number
  dodge: number
}

export function playerStatsFrom(c: Character, gear?: GearBonus): PlayerStats {
  const get = (key: string) => c.attributes.find((a) => a.key === key)?.value ?? 5
  return {
    maxHp: Math.round(70 + get('vit') * 3 + c.level * 4 + (gear?.hp ?? 0)),
    atk: 8 + get('str') * 0.7 + c.level * 0.6 + (gear?.atk ?? 0),
    def: 2 + get('end') * 0.3 + c.level * 0.3 + (gear?.def ?? 0),
    crit: Math.min(50, 5 + get('dis') * 0.2 + (gear?.crit ?? 0)),
    dodge: Math.min(40, 3 + get('dis') * 0.12 + (gear?.dodge ?? 0)),
  }
}

// ---------- Monstros ----------
export type MonsterKind = 'slime' | 'goblin' | 'skeleton' | 'golem' | 'bat' | 'orc' | 'wraith' | 'dragon'

export interface Monster {
  kind: MonsterKind
  name: string
  maxHp: number
  atk: number
  def: number
  gold: number
  boss?: boolean
}

export interface Dungeon {
  id: string
  rankLetter: string
  name: string
  cost: number // energia para entrar
  firstClearGold: number
  floors: Monster[]
}

export const DUNGEONS: Dungeon[] = [
  {
    id: 'E',
    rankLetter: 'E',
    name: 'Caverna Verde',
    cost: 10,
    firstClearGold: 100,
    floors: [
      { kind: 'slime', name: 'Gosma Verde', maxHp: 34, atk: 6, def: 1, gold: 8 },
      { kind: 'goblin', name: 'Goblin Ladrão', maxHp: 46, atk: 9, def: 2, gold: 12 },
      { kind: 'skeleton', name: 'Esqueleto Guarda', maxHp: 56, atk: 11, def: 3, gold: 16 },
      { kind: 'goblin', name: 'Goblin Capitão', maxHp: 66, atk: 12, def: 4, gold: 20 },
      { kind: 'golem', name: 'Golem de Pedra', maxHp: 120, atk: 14, def: 6, gold: 60, boss: true },
    ],
  },
  {
    id: 'D',
    rankLetter: 'D',
    name: 'Ruínas Sombrias',
    cost: 15,
    firstClearGold: 200,
    floors: [
      { kind: 'bat', name: 'Morcego Sombrio', maxHp: 112, atk: 19, def: 4, gold: 14 },
      { kind: 'skeleton', name: 'Esqueleto Soldado', maxHp: 152, atk: 29, def: 6, gold: 22 },
      { kind: 'goblin', name: 'Goblin Arqueiro', maxHp: 184, atk: 35, def: 10, gold: 29 },
      { kind: 'bat', name: 'Morcego Gigante', maxHp: 215, atk: 38, def: 13, gold: 36 },
      { kind: 'orc', name: 'Orc Berserker', maxHp: 383, atk: 45, def: 19, gold: 108, boss: true },
    ],
  },
  {
    id: 'C',
    rankLetter: 'C',
    name: 'Fortaleza Orc',
    cost: 20,
    firstClearGold: 350,
    floors: [
      { kind: 'goblin', name: 'Goblin Saqueador', maxHp: 244, atk: 30, def: 8, gold: 24 },
      { kind: 'orc', name: 'Orc Guerreiro', maxHp: 331, atk: 44, def: 14, gold: 36 },
      { kind: 'skeleton', name: 'Esqueleto Cavaleiro', maxHp: 401, atk: 54, def: 21, gold: 48 },
      { kind: 'orc', name: 'Orc Brutamontes', maxHp: 471, atk: 59, def: 27, gold: 60 },
      { kind: 'orc', name: 'Senhor da Guerra', maxHp: 837, atk: 69, def: 42, gold: 180, boss: true },
    ],
  },
  {
    id: 'B',
    rankLetter: 'B',
    name: 'Cripta Espectral',
    cost: 25,
    firstClearGold: 500,
    floors: [
      { kind: 'skeleton', name: 'Esqueleto Necromante', maxHp: 397, atk: 43, def: 13, gold: 36 },
      { kind: 'wraith', name: 'Espectro', maxHp: 539, atk: 65, def: 22, gold: 54 },
      { kind: 'bat', name: 'Morcego Vampiro', maxHp: 653, atk: 80, def: 32, gold: 72 },
      { kind: 'wraith', name: 'Espectro Ancião', maxHp: 766, atk: 87, def: 43, gold: 90 },
      { kind: 'golem', name: 'Golem de Obsidiana', maxHp: 1362, atk: 101, def: 65, gold: 270, boss: true },
    ],
  },
  {
    id: 'A',
    rankLetter: 'A',
    name: 'Covil Sombrio',
    cost: 30,
    firstClearGold: 700,
    floors: [
      { kind: 'wraith', name: 'Banshee', maxHp: 625, atk: 65, def: 19, gold: 52 },
      { kind: 'orc', name: 'Orc de Elite', maxHp: 848, atk: 98, def: 33, gold: 78 },
      { kind: 'golem', name: 'Golem de Ferro', maxHp: 1026, atk: 120, def: 49, gold: 104 },
      { kind: 'wraith', name: 'Fantasma Real', maxHp: 1205, atk: 131, def: 64, gold: 130 },
      { kind: 'dragon', name: 'Dragão Negro', maxHp: 2142, atk: 153, def: 97, gold: 390, boss: true },
    ],
  },
  {
    id: 'S',
    rankLetter: 'S',
    name: 'Ninho do Dragão',
    cost: 40,
    firstClearGold: 1200,
    floors: [
      { kind: 'orc', name: 'Orc Lendário', maxHp: 987, atk: 91, def: 28, gold: 72 },
      { kind: 'golem', name: 'Golem de Cristal', maxHp: 1340, atk: 137, def: 48, gold: 108 },
      { kind: 'wraith', name: 'Rei Espectral', maxHp: 1621, atk: 167, def: 71, gold: 144 },
      { kind: 'dragon', name: 'Dragão Jovem', maxHp: 1904, atk: 182, def: 93, gold: 180 },
      { kind: 'dragon', name: 'Dragão Ancião', maxHp: 3384, atk: 213, def: 141, gold: 540, boss: true },
    ],
  },
]

// ---------- Torre Infinita ----------
export const TOWER: Dungeon = {
  id: 'T',
  rankLetter: 'E',
  name: 'Torre Infinita',
  cost: 15,
  firstClearGold: 0,
  floors: [],
}

/** Força de um monstro comum em alguns andares-âncora; o resto é interpolado. */
const TOWER_ANCHORS: [number, number, number, number][] = [
  [1, 34, 6, 1],
  [5, 56, 11, 3],
  [15, 184, 35, 10],
  [25, 401, 54, 21],
  [35, 653, 80, 32],
  [45, 1026, 120, 49],
  [55, 1621, 167, 71],
]
const TOWER_EASE = 1 // ajuste fino da dificuldade da torre
const KIND_BANDS: MonsterKind[][] = [
  ['slime', 'goblin', 'skeleton', 'bat'],
  ['bat', 'skeleton', 'goblin', 'orc'],
  ['orc', 'skeleton', 'wraith', 'goblin'],
  ['wraith', 'orc', 'golem', 'skeleton'],
  ['wraith', 'golem', 'orc', 'dragon'],
]
const KIND_NAMES: Record<MonsterKind, string> = {
  slime: 'Gosma',
  goblin: 'Goblin',
  skeleton: 'Esqueleto',
  bat: 'Morcego',
  orc: 'Orc',
  wraith: 'Espectro',
  golem: 'Golem',
  dragon: 'Dragão',
}
const SUFFIXES = ['', 'Sombrio', 'Veterano', 'de Elite', 'Lendário', 'Ancião']
const BOSS_KINDS: MonsterKind[] = ['orc', 'golem', 'wraith', 'dragon']

function lerpLog(a: number, b: number, t: number): number {
  return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t)
}

/** O monstro do andar `floor` da torre (1, 2, 3...). Chefe a cada 10 andares. */
export function towerMonster(floor: number): Monster {
  const f = Math.max(1, Math.floor(floor))
  let hp: number
  let atk: number
  let def: number
  const last = TOWER_ANCHORS[TOWER_ANCHORS.length - 1]
  if (f >= last[0]) {
    const prev = TOWER_ANCHORS[TOWER_ANCHORS.length - 2]
    const steps = f - last[0]
    const per = (a: number, b: number) => Math.pow(a / b, 1 / (last[0] - prev[0]))
    hp = last[1] * Math.pow(per(last[1], prev[1]) * 1.01, steps)
    atk = last[2] * Math.pow(per(last[2], prev[2]) * 1.01, steps)
    def = last[3] * Math.pow(per(last[3], prev[3]) * 1.01, steps)
  } else {
    let i = 0
    while (TOWER_ANCHORS[i + 1][0] <= f) i++
    const a = TOWER_ANCHORS[i]
    const b = TOWER_ANCHORS[i + 1]
    const t = (f - a[0]) / (b[0] - a[0])
    hp = lerpLog(a[1], b[1], t)
    atk = lerpLog(a[2], b[2], t)
    def = lerpLog(a[3], b[3], t)
  }
  const band = Math.min(KIND_BANDS.length - 1, Math.floor((f - 1) / 10))
  const gold = Math.round(6 + f * 2.2)
  const boss = f % 10 === 0
  if (boss) {
    const kind = BOSS_KINDS[(f / 10 - 1) % BOSS_KINDS.length]
    return {
      kind,
      name: `${KIND_NAMES[kind]} Guardião (andar ${f})`,
      maxHp: Math.round(hp * 2.2),
      atk: Math.round(atk * TOWER_EASE * 1.2),
      def: Math.round(def * 1.4),
      gold: gold * 4,
      boss: true,
    }
  }
  const kind = KIND_BANDS[band][(f - 1) % 4]
  const suffix = SUFFIXES[Math.min(SUFFIXES.length - 1, Math.floor(f / 10))]
  return {
    kind,
    name: `${KIND_NAMES[kind]}${suffix ? ` ${suffix}` : ''}`,
    maxHp: Math.round(hp),
    atk: Math.round(atk * TOWER_EASE),
    def: Math.round(def),
    gold,
  }
}

// ---------- Estado da batalha ----------
export type Action = 'attack' | 'strong' | 'defend' | 'potion'

export interface BattleState {
  playerHp: number
  monsterHp: number
  turn: number
  strongCd: number // turnos que faltam para poder usar o golpe forte
  potions: number
  monsterActs: number
  telegraph: boolean // o monstro vai dar um golpe pesado na próxima vez
  log: string[]
  over: null | 'win' | 'lose'
  lastHit: { player: number; monster: number } // dano da última rodada (para animar)
}

export type Rng = () => number

const STRONG_COOLDOWN = 3
const spread = (rng: Rng) => 0.85 + rng() * 0.3

function isHeavy(m: Monster, acts: number): boolean {
  return Boolean(m.boss) && (acts + 1) % 3 === 0
}

export function newBattle(p: PlayerStats, m: Monster, potions: number, startHp?: number): BattleState {
  return {
    playerHp: Math.min(p.maxHp, Math.round(startHp ?? p.maxHp)),
    monsterHp: m.maxHp,
    turn: 1,
    strongCd: 0,
    potions,
    monsterActs: 0,
    telegraph: isHeavy(m, 0),
    log: [m.boss ? `${m.name} bloqueia o caminho!` : `Um ${m.name} apareceu!`],
    over: null,
    lastHit: { player: 0, monster: 0 },
  }
}

/** Executa a sua ação e a resposta do monstro. Devolve um estado novo. */
export function playTurn(
  prev: BattleState,
  action: Action,
  p: PlayerStats,
  m: Monster,
  rng: Rng,
): BattleState {
  if (prev.over) return prev
  const s: BattleState = { ...prev, log: [...prev.log], lastHit: { player: 0, monster: 0 } }
  const say = (t: string) => s.log.push(t)
  let defending = false

  // ----- sua ação -----
  if (action === 'potion') {
    if (s.potions <= 0) return prev
    const heal = Math.round(p.maxHp * 0.5)
    const gained = Math.min(heal, p.maxHp - s.playerHp)
    s.playerHp += gained
    s.potions -= 1
    say(`Você bebeu uma poção e recuperou ${gained} de vida.`)
  } else if (action === 'defend') {
    defending = true
    say('Você se protege com o escudo.')
  } else {
    if (action === 'strong' && s.strongCd > 0) return prev
    const mult = action === 'strong' ? 1.8 : 1
    const crit = rng() * 100 < p.crit
    const dmg = Math.max(1, Math.round(p.atk * mult * spread(rng) * (crit ? 1.6 : 1) - m.def * 0.6))
    s.monsterHp = Math.max(0, s.monsterHp - dmg)
    s.lastHit.monster = dmg
    say(
      `${action === 'strong' ? 'Golpe forte' : 'Ataque'}${crit ? ' CRÍTICO' : ''}: ${dmg} de dano em ${m.name}.`,
    )
    if (action === 'strong') s.strongCd = STRONG_COOLDOWN
  }

  if (s.monsterHp <= 0) {
    s.over = 'win'
    say(`${m.name} foi derrotado!`)
    return s
  }

  // ----- resposta do monstro -----
  const heavy = isHeavy(m, s.monsterActs)
  s.monsterActs += 1
  if (rng() * 100 < p.dodge) {
    say(`Você desviou do ataque de ${m.name}!`)
  } else {
    let dmg = Math.round(m.atk * (heavy ? 1.8 : 1) * spread(rng) - p.def * 0.6)
    if (defending) dmg = Math.round(dmg * 0.4)
    dmg = Math.max(1, dmg)
    s.playerHp = Math.max(0, s.playerHp - dmg)
    s.lastHit.player = dmg
    say(`${heavy ? 'Golpe pesado! ' : ''}${m.name} causou ${dmg} de dano em você.`)
  }

  if (s.playerHp <= 0) {
    s.over = 'lose'
    say('Você caiu em batalha...')
    return s
  }

  // ----- fim da rodada -----
  s.turn += 1
  if (s.strongCd > 0) s.strongCd -= defending ? 2 : 1
  if (s.strongCd < 0) s.strongCd = 0
  s.telegraph = isHeavy(m, s.monsterActs)
  if (s.telegraph) say(`${m.name} se prepara para um golpe pesado!`)
  s.log = s.log.slice(-6)
  return s
}

// ---------- Recompensas ----------
export interface Loot {
  gold: number
  potions: number
}

export function lootFor(m: Monster, rng: Rng): Loot {
  const potions = m.boss ? 1 : rng() < 0.2 ? 1 : 0
  return { gold: Math.round(m.gold * (0.9 + rng() * 0.2)), potions }
}