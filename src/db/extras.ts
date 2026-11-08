// made by: Gabriel Mattos
import { getGoal, nutritionDb, saveGoal, type FoodEntry, type Macros } from './nutrition'
import { getAllDays, type DaysMap } from '../utils/schedule'
import { getGame, sanitizeGame, saveGame, type GameState } from '../utils/gameState'
import { getLook, sanitizeLook, saveLook, type Look } from '../utils/look'
import { getClaimed, getName, resetSeenLevel, saveName, setClaimed } from '../utils/rpg'
import { applyTheme } from '../utils/theme'

// Ajustes simples que vão no backup. De propósito NÃO entram: a chave do Gemini (segredo),
// o lembrete de treino (precisaria reagendar o alarme) e avisos do tipo "já vi".
export const SETTINGS_KEYS = [
  'fitflow-theme',
  'fitflow-weekly-goal',
  'fitflow-plates',
  'fitflow-profile',
  'fitflow-auto-progression',
  'fitflow-rest-sound',
  'fitflow-keep-awake',
] as const

function readSettings(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of SETTINGS_KEYS) {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) out[key] = value
    } catch {
      // sem armazenamento, sem problema
    }
  }
  return out
}

// Dados novos (dieta, dias da semana, personagem, ajustes) que vão junto no arquivo de backup
export interface Extras {
  nutrition: Omit<FoodEntry, 'id'>[]
  days: DaysMap
  goal: Macros | null
  rpg: { name: string; claimed: Record<string, number>; look: Look }
  game: GameState | null
  settings: Record<string, string> // backups antigos não têm: fica vazio
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
    settings: readSettings(),
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
      // só entram as chaves da lista acima, e só texto de tamanho razoável
      settings: Object.fromEntries(
        Object.entries(raw.settings && typeof raw.settings === 'object' ? raw.settings : {}).filter(
          ([k, v]) => (SETTINGS_KEYS as readonly string[]).includes(k) && typeof v === 'string' && v.length <= 5000,
        ),
      ) as Record<string, string>,
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
  for (const [key, value] of Object.entries(extras.settings)) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // sem armazenamento, sem problema
    }
  }
  applyTheme() // o tema restaurado vale na hora
  resetSeenLevel() // evita comemorar um nível "novo" só porque o backup foi importado
  return extras.nutrition.length
}