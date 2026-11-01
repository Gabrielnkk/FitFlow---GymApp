import type { Exercise, MuscleGroup } from '../types'
import { newId } from '../utils/id'

type SeedItem = [name: string, group: MuscleGroup, equipment: string]

const items: SeedItem[] = [
  // Peito
  ['Supino reto com barra', 'Peito', 'Barra'],
  ['Supino inclinado com barra', 'Peito', 'Barra'],
  ['Supino declinado', 'Peito', 'Barra'],
  ['Supino reto com halteres', 'Peito', 'Halteres'],
  ['Supino inclinado com halteres', 'Peito', 'Halteres'],
  ['Supino na máquina', 'Peito', 'Máquina'],
  ['Crucifixo', 'Peito', 'Halteres'],
  ['Crucifixo inclinado', 'Peito', 'Halteres'],
  ['Crossover na polia', 'Peito', 'Polia'],
  ['Peck deck (voador)', 'Peito', 'Máquina'],
  ['Flexão de braço', 'Peito', 'Peso do corpo'],
  ['Paralelas (mergulho)', 'Peito', 'Paralelas'],
  ['Pullover', 'Peito', 'Halteres'],

  // Costas
  ['Puxada na frente', 'Costas', 'Polia'],
  ['Puxada atrás da nuca', 'Costas', 'Polia'],
  ['Puxada com triângulo', 'Costas', 'Polia'],
  ['Puxada supinada', 'Costas', 'Polia'],
  ['Remada curvada', 'Costas', 'Barra'],
  ['Remada baixa', 'Costas', 'Polia'],
  ['Remada unilateral (serrote)', 'Costas', 'Halteres'],
  ['Remada cavalinho', 'Costas', 'Barra T'],
  ['Remada na máquina', 'Costas', 'Máquina'],
  ['Barra fixa', 'Costas', 'Barra fixa'],
  ['Levantamento terra', 'Costas', 'Barra'],
  ['Pulldown com corda', 'Costas', 'Polia'],
  ['Encolhimento (trapézio)', 'Costas', 'Halteres'],
  ['Extensão lombar', 'Costas', 'Banco lombar'],

  // Ombros
  ['Desenvolvimento com halteres', 'Ombros', 'Halteres'],
  ['Desenvolvimento com barra', 'Ombros', 'Barra'],
  ['Desenvolvimento na máquina', 'Ombros', 'Máquina'],
  ['Desenvolvimento Arnold', 'Ombros', 'Halteres'],
  ['Elevação lateral', 'Ombros', 'Halteres'],
  ['Elevação lateral na polia', 'Ombros', 'Polia'],
  ['Elevação frontal', 'Ombros', 'Halteres'],
  ['Crucifixo invertido', 'Ombros', 'Halteres'],
  ['Face pull', 'Ombros', 'Polia'],
  ['Remada alta', 'Ombros', 'Barra'],

  // Bíceps
  ['Rosca direta', 'Bíceps', 'Barra'],
  ['Rosca direta barra W', 'Bíceps', 'Barra W'],
  ['Rosca alternada', 'Bíceps', 'Halteres'],
  ['Rosca martelo', 'Bíceps', 'Halteres'],
  ['Rosca concentrada', 'Bíceps', 'Halteres'],
  ['Rosca Scott', 'Bíceps', 'Banco Scott'],
  ['Rosca na polia', 'Bíceps', 'Polia'],
  ['Rosca inclinada', 'Bíceps', 'Halteres'],

  // Tríceps
  ['Tríceps na polia', 'Tríceps', 'Polia'],
  ['Tríceps corda', 'Tríceps', 'Polia'],
  ['Tríceps testa', 'Tríceps', 'Barra'],
  ['Tríceps francês', 'Tríceps', 'Halteres'],
  ['Tríceps coice', 'Tríceps', 'Halteres'],
  ['Tríceps banco', 'Tríceps', 'Peso do corpo'],
  ['Supino fechado', 'Tríceps', 'Barra'],

  // Pernas
  ['Agachamento livre', 'Pernas', 'Barra'],
  ['Agachamento frontal', 'Pernas', 'Barra'],
  ['Agachamento no Smith', 'Pernas', 'Smith'],
  ['Agachamento búlgaro', 'Pernas', 'Halteres'],
  ['Agachamento hack', 'Pernas', 'Máquina'],
  ['Agachamento sumô', 'Pernas', 'Halteres'],
  ['Leg press 45°', 'Pernas', 'Máquina'],
  ['Leg press', 'Pernas', 'Máquina'],
  ['Cadeira extensora', 'Pernas', 'Máquina'],
  ['Mesa flexora', 'Pernas', 'Máquina'],
  ['Cadeira flexora', 'Pernas', 'Máquina'],
  ['Cadeira adutora', 'Pernas', 'Máquina'],
  ['Cadeira abdutora', 'Pernas', 'Máquina'],
  ['Afundo (passada)', 'Pernas', 'Halteres'],
  ['Avanço no lugar', 'Pernas', 'Halteres'],
  ['Passada andando', 'Pernas', 'Halteres'],
  ['Step-up', 'Pernas', 'Banco'],

  // Glúteos
  ['Stiff', 'Glúteos', 'Barra'],
  ['Stiff com halteres', 'Glúteos', 'Halteres'],
  ['Elevação pélvica', 'Glúteos', 'Barra'],
  ['Glúteo na polia (coice)', 'Glúteos', 'Polia'],
  ['Glúteo na máquina', 'Glúteos', 'Máquina'],
  ['Abdução de quadril', 'Glúteos', 'Elástico'],

  // Abdômen
  ['Abdominal na máquina', 'Abdômen', 'Máquina'],
  ['Abdominal reto (crunch)', 'Abdômen', 'Peso do corpo'],
  ['Abdominal infra (elevação de pernas)', 'Abdômen', 'Peso do corpo'],
  ['Abdominal na polia', 'Abdômen', 'Polia'],
  ['Abdominal oblíquo', 'Abdômen', 'Peso do corpo'],
  ['Prancha', 'Abdômen', 'Peso do corpo'],
  ['Prancha lateral', 'Abdômen', 'Peso do corpo'],
  ['Roda abdominal', 'Abdômen', 'Roda'],
  ['Elevação de pernas na barra', 'Abdômen', 'Barra fixa'],

  // Panturrilha
  ['Panturrilha em pé', 'Panturrilha', 'Máquina'],
  ['Panturrilha sentado', 'Panturrilha', 'Máquina'],
  ['Panturrilha no leg press', 'Panturrilha', 'Máquina'],
  ['Panturrilha no degrau', 'Panturrilha', 'Peso do corpo'],

  // Cardio
  ['Esteira', 'Cardio', 'Esteira'],
  ['Bicicleta ergométrica', 'Cardio', 'Bicicleta'],
  ['Elíptico', 'Cardio', 'Elíptico'],
  ['Escada (simulador)', 'Cardio', 'Escada'],
  ['Remo ergométrico', 'Cardio', 'Remo'],
  ['Corda naval', 'Cardio', 'Corda'],
  ['Pular corda', 'Cardio', 'Corda'],
  ['Caminhada', 'Cardio', 'Livre'],
  ['Corrida', 'Cardio', 'Livre'],

  // Outro
  ['Rosca de punho', 'Outro', 'Halteres'],
  ['Rosca de punho inversa', 'Outro', 'Halteres'],
  ['Alongamento geral', 'Outro', 'Peso do corpo'],
]

export function buildDefaultExercises(): Exercise[] {
  return items.map(([name, muscleGroup, equipment]) => ({
    id: newId(),
    name,
    muscleGroup,
    equipment,
    notes: '',
    isDefault: true,
  }))
}