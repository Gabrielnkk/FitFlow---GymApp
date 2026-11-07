// made by: Gabriel Mattos
import { db } from './database'
import type { BackupFile } from '../types'

export async function buildBackup(): Promise<BackupFile> {
  const [exercises, workouts, sessions, bodyEntries] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.sessions.where('status').equals('finished').toArray(),
    db.bodyEntries.toArray(),
  ])
  return {
    app: 'fitflow',
    version: 1,
    exportedAt: Date.now(),
    exercises,
    workouts,
    sessions,
    bodyEntries,
  }
}

function isListWithIds(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' && item !== null && typeof (item as { id?: unknown }).id === 'string',
    )
  )
}

// Lê o texto do arquivo e confere se parece um backup do FitFlow
export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  const b = data as Partial<BackupFile> | null
  if (!b || typeof b !== 'object' || b.app !== 'fitflow') {
    throw new Error('Este arquivo não é um backup do FitFlow.')
  }
  if (b.version !== 1) {
    throw new Error('Versão de backup não suportada.')
  }
  if (!isListWithIds(b.exercises) || !isListWithIds(b.workouts) || !isListWithIds(b.sessions)) {
    throw new Error('O backup está incompleto ou corrompido.')
  }
  if (b.bodyEntries !== undefined && !isListWithIds(b.bodyEntries)) {
    throw new Error('Os registros de peso e medidas do backup estão corrompidos.')
  }
  const problem = findContentProblem(b as BackupFile)
  if (problem) throw new Error(`O backup está corrompido: ${problem}. Nada foi alterado.`)
  return b as BackupFile
}

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// Se o campo existe, precisa ser um número de verdade (nem texto, nem NaN)
function badNumber(o: Obj, key: string): boolean {
  return o[key] !== undefined && !(typeof o[key] === 'number' && Number.isFinite(o[key]))
}

/** Olha dentro de cada item do backup. Devolve o primeiro problema encontrado (ou null se está tudo certo). */
function findContentProblem(b: BackupFile): string | null {
  for (const e of b.exercises as unknown as Obj[]) {
    if (typeof e.name !== 'string' || e.name.trim() === '') return 'há um exercício sem nome'
    if (typeof e.muscleGroup !== 'string') return `o exercício "${e.name}" não tem grupo muscular`
  }
  for (const w of b.workouts as unknown as Obj[]) {
    if (typeof w.name !== 'string') return 'há um treino sem nome'
    if (!Array.isArray(w.items)) return `o treino "${w.name}" não tem lista de exercícios`
    for (const it of w.items) {
      if (!isObj(it) || typeof it.exerciseId !== 'string') {
        return `o treino "${w.name}" tem um exercício inválido`
      }
      if (['sets', 'targetReps', 'restSeconds'].some((k) => badNumber(it, k))) {
        return `o treino "${w.name}" tem números inválidos`
      }
    }
  }
  for (const s of b.sessions as unknown as Obj[]) {
    if (typeof s.startedAt !== 'number' || !Number.isFinite(s.startedAt)) {
      return 'há uma sessão do histórico sem data'
    }
    if (!Array.isArray(s.exercises)) return 'há uma sessão do histórico sem exercícios'
    for (const ex of s.exercises) {
      if (!isObj(ex) || typeof ex.exerciseId !== 'string' || !Array.isArray(ex.sets)) {
        return 'há um exercício inválido dentro do histórico'
      }
      for (const st of ex.sets) {
        if (!isObj(st) || badNumber(st, 'weight') || badNumber(st, 'reps')) {
          return 'há uma série com números inválidos no histórico'
        }
      }
    }
  }
  for (const e of (b.bodyEntries ?? []) as unknown as Obj[]) {
    if (typeof e.date !== 'number' || !Number.isFinite(e.date)) return 'há um registro de peso sem data'
  }
  return null
}

export interface RestoreResult {
  exercises: number
  workouts: number
  sessions: number
  bodyEntries: number
}

// Substitui exercícios, treinos, histórico e (se o backup tiver) peso e medidas
export async function restoreBackup(backup: BackupFile): Promise<RestoreResult> {
  const sessions = backup.sessions.filter((s) => s.status === 'finished')

  await db.transaction('rw', db.exercises, db.workouts, db.sessions, db.bodyEntries, async () => {
    await db.exercises.clear()
    await db.workouts.clear()
    await db.sessions.where('status').equals('finished').delete()
    await db.exercises.bulkPut(backup.exercises)
    await db.workouts.bulkPut(backup.workouts)
    await db.sessions.bulkPut(sessions)
    // Backups antigos não têm este campo: nesse caso os registros atuais são mantidos
    if (backup.bodyEntries) {
      await db.bodyEntries.clear()
      await db.bodyEntries.bulkPut(backup.bodyEntries)
    }
  })

  return {
    exercises: backup.exercises.length,
    workouts: backup.workouts.length,
    sessions: sessions.length,
    bodyEntries: backup.bodyEntries?.length ?? 0,
  }
}