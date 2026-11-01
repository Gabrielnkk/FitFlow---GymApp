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
  return b as BackupFile
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