import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { getGoal, nutritionDb } from '../db/nutrition'
import { RPG_EVENT, buildCharacter, getClaimed, getName, getWeeklyGoal } from '../utils/rpg'
import { computeStats } from '../utils/rpgStats'

/** Reúne treinos e dieta e devolve o personagem calculado (ou null enquanto carrega). */
export function useRpg() {
  const finished = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray())
  const entries = useLiveQuery(() => nutritionDb.entries.toArray())
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1)
    window.addEventListener(RPG_EVENT, onChange)
    return () => window.removeEventListener(RPG_EVENT, onChange)
  }, [])

  return useMemo(() => {
    if (!finished || !entries) return null
    const goal = getGoal()
    const weeklyGoal = getWeeklyGoal()
    const stats = computeStats(finished, entries, goal, weeklyGoal)
    const character = buildCharacter(stats, getClaimed())
    return { finished, entries, goal, weeklyGoal, stats, character, name: getName() }
    // version força recalcular quando o nome ou as missões resgatadas mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, entries, version])
}