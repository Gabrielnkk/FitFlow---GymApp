export type MuscleGroup =
  | 'Peito'
  | 'Costas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Pernas'
  | 'Glúteos'
  | 'Abdômen'
  | 'Panturrilha'
  | 'Cardio'
  | 'Outro'

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Pernas',
  'Glúteos',
  'Abdômen',
  'Panturrilha',
  'Cardio',
  'Outro',
]

// Um exercício da biblioteca
export type ExerciseMode = 'reps' | 'time'
export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  equipment: string
  notes: string
  isDefault: boolean // true = veio pré-cadastrado
  mode?: ExerciseMode // 'time' = medido em segundos (vazio = repetições)
}

// Um exercício dentro de uma rotina de treino
export interface WorkoutExercise {
  exerciseId: string
  sets: number // quantidade de séries
  targetReps: number // repetições alvo por série
  restSeconds: number // descanso entre séries
  targetSeconds?: number // meta em segundos (só exercícios de tempo)~
  superset?: boolean // liga este exercício ao próximo

}

// Uma rotina (ex.: "Treino A - Peito e Tríceps")
export interface Workout {
  id: string
  name: string
  items: WorkoutExercise[]
  createdAt: number
  updatedAt: number
    order?: number // posição na lista (menor = mais acima)
}
export type SetKind = 'normal' | 'warmup' | 'failure' | 'drop'
export type CardioLevel = 'warmup' | 'easy' | 'moderate' | 'hard' | 'interval' | 'cooldown'
// Uma série registrada durante o treino
export interface SessionSet {
  weight: number // kg
  reps: number
  done: boolean
  rpeManual?: number // RPE que você escolheu (vale mais que o automático)
  rpe?: number // RPE final, salvo no histórico
  kind?: SetKind // tipo da série (vazio = normal)
  seconds?: number // tempo da série, em segundos (só exercícios de tempo)
    cardio?: CardioLevel // intensidade (só exercícios de cardio)
  timerEndsAt?: number // hora em que o cronômetro desta série termina (vazio = parado)
}

// Um exercício dentro de uma sessão
export interface SessionExercise {
  exerciseId: string
  exerciseName: string // guardamos o nome para o histórico não quebrar se o exercício for apagado
  restSeconds: number
  targetReps: number
  sets: SessionSet[]
  mode?: ExerciseMode
  targetSeconds?: number
  progress?: { action: 'up' | 'hold' | 'down'; reason: string } // sugestão automática
  cardio?: boolean // true = exercício do grupo Cardio
  superset?: boolean
}

// Uma sessão de treino (em andamento ou finalizada)
export interface Session {
  id: string
  workoutId: string | null // null = treino avulso
  name: string
  status: 'active' | 'finished'
  startedAt: number
  finishedAt: number | null
  exercises: SessionExercise[]
  restEndsAt?: number | null // horário em que o descanso termina
    notes?: string
}

// Formato do arquivo de backup
export interface BackupFile {
  app: 'fitflow'
  version: 1
  exportedAt: number
  exercises: Exercise[]
  workouts: Workout[]
  sessions: Session[]
    bodyEntries?: BodyEntry[]
}
export type BodyKey =
  | 'weight'
  | 'bodyFat'
  | 'waist'
  | 'chest'
  | 'arm'
  | 'thigh'
  | 'hips'
  | 'calf'

// Um registro de peso e medidas (todos os campos são opcionais)
export interface BodyEntry extends Partial<Record<BodyKey, number>> {
  id: string
  date: number // meio-dia do dia registrado, em milissegundos
}