import Dexie, { type EntityTable } from 'dexie'
import type { BodyEntry, Exercise, Session, Workout } from '../types'
import { buildDefaultExercises } from './seed'

export const db = new Dexie('fitflow') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  workouts: EntityTable<Workout, 'id'>
  sessions: EntityTable<Session, 'id'>
  bodyEntries: EntityTable<BodyEntry, 'id'>
}

db.version(1).stores({
  exercises: 'id, name, muscleGroup',
  workouts: 'id, name, updatedAt',
  sessions: 'id, status, startedAt',
})

// Versão 2: peso corporal e medidas
db.version(2).stores({
  bodyEntries: 'id, date',
})

// Roda só na primeira vez que o banco é criado
db.on('populate', (tx) => {
  tx.table('exercises').bulkAdd(buildDefaultExercises())
})