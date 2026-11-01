import { db } from './database'
import type { Exercise, Session, SessionExercise, Workout } from '../types'
import { newId } from '../utils/id'
import { buildBaselines, rpeForSets } from '../utils/rpe'
import { isWorkingSet } from '../utils/sets'
import { isAutoProgressionOn, suggestProgression, type Suggestion } from './progression'
// Séries da última vez que você fez este exercício (ou null)
async function lastSetsFor(exerciseId: string) {
  const last = await db.sessions
    .orderBy('startedAt')
    .reverse()
    .filter((s) => s.status === 'finished' && s.exercises.some((e) => e.exerciseId === exerciseId))
    .first()
   const working = last?.exercises
    .find((e) => e.exerciseId === exerciseId)
    ?.sets.filter(isWorkingSet)
  return working && working.length > 0 ? working : null}

export async function buildSessionExercise(
  ex: Exercise,
  sets: number,
  targetReps: number,
  restSeconds: number,
  targetSeconds?: number,
): Promise<SessionExercise> {
  const lastSets = await lastSetsFor(ex.id)
  const lastWeight = lastSets && lastSets.length > 0 ? lastSets[lastSets.length - 1].weight : 0
  const isTime = ex.mode === 'time'
  const baseSeconds = targetSeconds ?? (ex.muscleGroup === 'Cardio' ? 600 : 30)

  // Progressão automática (se estiver ligada em Ajustes)
  let suggestion: Suggestion | null = null
  if (isAutoProgressionOn()) {
    const finished = await db.sessions.where('status').equals('finished').toArray()
    suggestion = suggestProgression(finished, ex.id)
  }

  // Cada série sobe (ou desce) o mesmo valor, preservando a "pirâmide"
  const delta = suggestion && !isTime ? suggestion.weight - suggestion.last : 0
  const seconds =
    isTime && suggestion?.action === 'up' && suggestion.seconds
      ? Math.max(suggestion.seconds, baseSeconds)
      : baseSeconds

  return {
    exerciseId: ex.id,
    exerciseName: ex.name,
    mode: isTime ? 'time' : 'reps',
   cardio: ex.muscleGroup === 'Cardio' ? true : undefined,
    restSeconds,
    targetReps,
    targetSeconds: isTime ? seconds : undefined,
    progress: suggestion ? { action: suggestion.action, reason: suggestion.reason } : undefined,
    sets: Array.from({ length: sets }, (_, i) => ({
      weight: Math.max(0, (lastSets?.[i]?.weight ?? lastWeight) + delta),
      reps: isTime ? 0 : targetReps,
      seconds: isTime ? seconds : undefined,
      done: false,
    })),
  }
}

export async function startWorkoutSession(workout: Workout): Promise<void> {
  const found = await db.exercises.bulkGet(workout.items.map((i) => i.exerciseId))
  const exercises: SessionExercise[] = []
  for (let i = 0; i < workout.items.length; i++) {
    const ex = found[i]
    if (!ex) continue
    const item = workout.items[i]
           const built = await buildSessionExercise(ex, item.sets, item.targetReps, item.restSeconds)
    exercises.push(item.superset && i < workout.items.length - 1 ? { ...built, superset: true } : built)
  }
  await db.sessions.add({
    id: newId(),
    workoutId: workout.id,
    name: workout.name,
    status: 'active',
    startedAt: Date.now(),
    finishedAt: null,
    exercises,
    restEndsAt: null,
  })
}

export async function startEmptySession(): Promise<void> {
  await db.sessions.add({
    id: newId(),
    workoutId: null,
    name: 'Treino avulso',
    status: 'active',
    startedAt: Date.now(),
    finishedAt: null,
    exercises: [],
    restEndsAt: null,
  })
}

// Lê a sessão atual do banco, aplica a mudança e salva (tudo de uma vez)
export async function mutateSession(id: string, change: (s: Session) => void): Promise<void> {
  await db.transaction('rw', db.sessions, async () => {
    const s = await db.sessions.get(id)
    if (!s) return
    change(s)
    await db.sessions.put(s)
  })
}

// Salva só as séries concluídas (já com o RPE). Retorna false se não sobrou nada.
// Salva só as séries concluídas (já com o RPE). Retorna false se não sobrou nada.
export async function finishSession(id: string): Promise<boolean> {
  const s = await db.sessions.get(id)
  if (!s) return false

  const finished = await db.sessions.where('status').equals('finished').toArray()
  const baselines = buildBaselines(finished)

  const exercises = s.exercises
    .map((e) => {
      // RPE automático calculado com todas as séries (considera o cansaço acumulado)
      const auto = rpeForSets(e.sets, baselines.get(e.exerciseId))
      return {
        ...e,
        sets: e.sets
          .map((x, i) => ({ x, i }))
          .filter(({ x }) => x.done)
          .map(({ x, i }) => {
            const rpe = x.kind === 'warmup' ? null : (x.rpeManual ?? auto[i])
            return rpe == null ? x : { ...x, rpe }
          }),
      }
    })
    .filter((e) => e.sets.length > 0)

  if (exercises.length === 0) {
    await db.sessions.delete(id)
    return false
  }
  await db.sessions.put({
    ...s,
    exercises,
    status: 'finished',
    finishedAt: Date.now(),
    restEndsAt: null,
  })
  return true
}