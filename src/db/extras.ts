// made by: Gabriel Mattos
import { getGoal, nutritionDb, saveGoal, type FoodEntry, type Macros } from './nutrition'
import { getAllDays, type DaysMap } from '../utils/schedule'
import { getGame, sanitizeGame, saveGame, type GameState } from '../utils/gameState'
import { getLook, sanitizeLook, saveLook, type Look } from '../utils/look'
import { getClaimed, getName, resetSeenLevel, saveName, setClaimed } from '../utils/rpg'

// Dados novos (dieta, dias da semana, personagem) que vão junto no arquivo de backup
export interface Extras {
  nutrition: Omit<FoodEntry, 'id'>[]
  days: DaysMap
  goal: Macros | null
  rpg: { name: string; claimed: Record<string, number>; look: Look }
  game: GameState | null
}

// Copia o alimento sem o "id" (o banco cria um novo ao restaurar)
function withoutId(entry: FoodEntry): Omit<FoodEntry, 'id'> {
  const copy = { ...entry }
  delete copy.id
  return copy
}

export async function buildExtras(): Promise<Extras> {
  const entries = await nutritionDb.entries.toArray()
  return {
    nutrition: entries.map(withoutId),
    days: getAllDays(),
    goal: getGoal(),
    rpg: { name: getName(), claimed: getClaimed(), look: getLook() },
    game: getGame(),
  }
}

/** Lê os dados extras de dentro do arquivo de backup. Backups antigos não têm: devolve null. */
export function readExtras(text: string): Extras | null {
  try {
    const raw = (JSON.parse(text) as { extras?: Partial<Extras> }).extras
    if (!raw || typeof raw !== 'object') return null
    return {
      // só entra alimento com cara de alimento; o id é descartado (o banco cria um novo)
      nutrition: Array.isArray(raw.nutrition)
        ? raw.nutrition
            .filter(
              (e): e is Omit<FoodEntry, 'id'> =>
                typeof e === 'object' &&
                e !== null &&
                typeof (e as FoodEntry).name === 'string' &&
                typeof (e as FoodEntry).date === 'string' &&
                Number.isFinite((e as FoodEntry).kcal),
            )
            .map((e) => withoutId(e as FoodEntry))
        : [],
      days: raw.days && typeof raw.days === 'object' ? raw.days : {},
      goal: raw.goal && typeof raw.goal === 'object' ? raw.goal : null,
      rpg: {
        name: typeof raw.rpg?.name === 'string' ? raw.rpg.name : 'Atleta',
        claimed: raw.rpg?.claimed && typeof raw.rpg.claimed === 'object' ? raw.rpg.claimed : {},
        look: sanitizeLook(raw.rpg?.look),
      },
      game: sanitizeGame(raw.game),
    }
  } catch {
    return null
  }
}

/** Troca os dados atuais pelos do backup. Devolve quantos alimentos foram restaurados. */
export async function restoreExtras(extras: Extras): Promise<number> {
  // Tudo ou nada: se der erro no meio, a dieta atual continua como estava
  await nutritionDb.transaction('rw', nutritionDb.entries, async () => {
    await nutritionDb.entries.clear()
    if (extras.nutrition.length > 0) await nutritionDb.entries.bulkAdd(extras.nutrition as FoodEntry[])
  })
  try {
    localStorage.setItem('fitflow-workout-days', JSON.stringify(extras.days))
  } catch {
    // sem armazenamento, sem problema
  }
  if (extras.goal) saveGoal(extras.goal)
  saveName(extras.rpg.name)
  setClaimed(extras.rpg.claimed)
  saveLook(extras.rpg.look)
  if (extras.game) saveGame(extras.game)
  resetSeenLevel() // evita comemorar um nível "novo" só porque o backup foi importado
  return extras.nutrition.length
}