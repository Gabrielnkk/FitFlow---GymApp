import type { Exercise, MuscleGroup } from '../types'
import { newId } from '../utils/id'

// Exercícios que já vieram cadastrados e passam a ser medidos por tempo
export const TIME_EXERCISE_NAMES = [
  'Prancha',
  'Prancha lateral',
  'Alongamento geral',
  'Esteira',
  'Bicicleta ergométrica',
  'Elíptico',
  'Escada (simulador)',
  'Remo ergométrico',
  'Corda naval',
  'Pular corda',
  'Caminhada',
  'Corrida',
]

const extra: [name: string, group: MuscleGroup, equipment: string][] = [
  ['Suspensão na barra', 'Costas', 'Barra fixa'],
  ['Agachamento isométrico na parede', 'Pernas', 'Peso do corpo'],
  ['Hollow hold', 'Abdômen', 'Peso do corpo'],
  ['Prancha com peso', 'Abdômen', 'Anilha'],
  ['Ponte de glúteo isométrica', 'Glúteos', 'Peso do corpo'],
]

export function buildTimeExercises(): Exercise[] {
  return extra.map(([name, muscleGroup, equipment]) => ({
    id: newId(),
    name,
    muscleGroup,
    equipment,
    notes: '',
    isDefault: true,
    mode: 'time' as const,
  }))
}