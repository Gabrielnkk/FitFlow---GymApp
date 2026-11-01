import type { Session } from '../types'
import { addDays, dateKey, type FoodEntry, type Macros } from '../db/nutrition'
import { weekStartOf } from '../db/volume'
import type { Stats } from './rpgStats'
import { getClaimed } from './rpg'

export interface MissionCtx {
  finished: Session[]
  entries: FoodEntry[]
  goal: Macros | null
  weeklyGoal: number
  stats: Stats
}

interface Range {
  sessions: Session[]
  dayKeys: Set<string>
}

interface MissionDef {
  key: string
  title: (ctx: MissionCtx) => string
  xp: number
  target: (ctx: MissionCtx) => number
  value: (ctx: MissionCtx, r: Range) => number
  needsGoal?: boolean
}

const sum = (list: Session[], map: Map<string, number>) =>
  list.reduce((t, s) => t + (map.get(s.id) ?? 0), 0)

const entriesIn = (ctx: MissionCtx, r: Range) => ctx.entries.filter((e) => r.dayKeys.has(e.date))

const DAILY: MissionDef[] = [
  { key: 'train', title: () => 'Finalize um treino hoje', xp: 40, target: () => 1, value: (_c, r) => r.sessions.length },
  { key: 'sets', title: () => 'Faça 12 séries hoje', xp: 40, target: () => 12, value: (c, r) => sum(r.sessions, c.stats.setsBySession) },
  { key: 'pr', title: () => 'Bata um recorde hoje', xp: 60, target: () => 1, value: (c, r) => sum(r.sessions, c.stats.prBySession) },
  { key: 'diet', title: () => 'Registre 3 alimentos na dieta', xp: 30, target: () => 3, value: (c, r) => entriesIn(c, r).length },
  {
    key: 'protein',
    title: (c) => `Chegue a 90% da meta de proteína (${Math.round((c.goal?.protein ?? 0) * 0.9)} g)`,
    xp: 40,
    target: () => 1,
    needsGoal: true,
    value: (c, r) => {
      const p = entriesIn(c, r).reduce((t, e) => t + e.protein, 0)
      return c.goal && p >= c.goal.protein * 0.9 ? 1 : 0
    },
  },
  {
    key: 'kcal',
    title: () => 'Fique perto da meta de calorias (90% a 110%)',
    xp: 40,
    target: () => 1,
    needsGoal: true,
    value: (c, r) => {
      const list = entriesIn(c, r)
      const k = list.reduce((t, e) => t + e.kcal, 0)
      return c.goal && list.length > 0 && k >= c.goal.kcal * 0.9 && k <= c.goal.kcal * 1.1 ? 1 : 0
    },
  },
]

const WEEKLY: MissionDef[] = [
  {
    key: 'days',
    title: (c) => `Treine ${c.weeklyGoal} dias na semana`,
    xp: 120,
    target: (c) => c.weeklyGoal,
    value: (_c, r) =>
      new Set(r.sessions.map((s) => dateKey(new Date(s.finishedAt ?? s.startedAt)))).size,
  },
  { key: 'sets', title: () => 'Faça 60 séries na semana', xp: 100, target: () => 60, value: (c, r) => sum(r.sessions, c.stats.setsBySession) },
  { key: 'pr', title: () => 'Bata 2 recordes na semana', xp: 100, target: () => 2, value: (c, r) => sum(r.sessions, c.stats.prBySession) },
  { key: 'vol', title: () => 'Levante 15.000 kg na semana', xp: 100, target: () => 15000, value: (c, r) => Math.round(sum(r.sessions, c.stats.volumeBySession)) },
  { key: 'diet', title: () => 'Registre a dieta em 5 dias', xp: 100, target: () => 5, value: (c, r) => new Set(entriesIn(c, r).map((e) => e.date)).size },
]

export interface Mission {
  id: string
  scope: 'day' | 'week'
  title: string
  xp: number
  value: number
  target: number
  done: boolean
  claimed: boolean
}

/** Sorteio fixo por data: o mesmo dia sempre dá as mesmas missões. */
function pick(pool: MissionDef[], seed: number, n: number, always?: string): MissionDef[] {
  return pool
    .map((d, i) => ({ d, s: d.key === always ? -1 : (seed * 31 + i * 7919) % 1013 }))
    .sort((a, b) => a.s - b.s)
    .slice(0, n)
    .map((x) => x.d)
}

function make(
  defs: MissionDef[],
  scope: 'day' | 'week',
  startKey: string,
  ctx: MissionCtx,
  dayKeys: Set<string>,
  claimed: Record<string, number>,
): Mission[] {
  const sessions = ctx.finished.filter((s) =>
    dayKeys.has(dateKey(new Date(s.finishedAt ?? s.startedAt))),
  )
  const range: Range = { sessions, dayKeys }
  return defs.map((d) => {
    const id = `${scope === 'day' ? 'd' : 'w'}:${startKey}:${d.key}`
    const target = d.target(ctx)
    const value = d.value(ctx, range)
    return {
      id,
      scope,
      title: d.title(ctx),
      xp: d.xp,
      value: Math.min(value, target),
      target,
      done: value >= target,
      claimed: claimed[id] !== undefined,
    }
  })
}

export function buildMissions(ctx: MissionCtx, now: number): { daily: Mission[]; weekly: Mission[] } {
  const claimed = getClaimed()

  const todayKey = dateKey(new Date(now))
  const dailyPool = DAILY.filter((d) => !d.needsGoal || ctx.goal)
  const daily = make(
    pick(dailyPool, Number(todayKey.replace(/-/g, '')), 3, 'train'),
    'day',
    todayKey,
    ctx,
    new Set([todayKey]),
    claimed,
  )

  const weekKey = dateKey(new Date(weekStartOf(now)))
  const weekKeys = new Set(Array.from({ length: 7 }, (_, i) => addDays(weekKey, i)))
  const weekly = make(
    pick(WEEKLY, Number(weekKey.replace(/-/g, '')), 3, 'days'),
    'week',
    weekKey,
    ctx,
    weekKeys,
    claimed,
  )

  return { daily, weekly }
}