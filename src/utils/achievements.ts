import type { Stats } from './rpgStats'

export const ACHIEVEMENT_XP = 50

export interface Achievement {
  id: string
  icon: string
  title: string
  desc: string
  target: number
  value: (s: Stats) => number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', icon: '🎯', title: 'Primeiro passo', desc: 'Finalize seu primeiro treino', target: 1, value: (s) => s.sessions },
  { id: 's10', icon: '🔥', title: 'Pegando o ritmo', desc: 'Finalize 10 treinos', target: 10, value: (s) => s.sessions },
  { id: 's50', icon: '💪', title: 'Consistente', desc: 'Finalize 50 treinos', target: 50, value: (s) => s.sessions },
  { id: 's100', icon: '🏅', title: 'Centurião', desc: 'Finalize 100 treinos', target: 100, value: (s) => s.sessions },
  { id: 'sets100', icon: '🔁', title: 'Cem séries', desc: 'Complete 100 séries', target: 100, value: (s) => s.sets },
  { id: 'sets1000', icon: '⚙️', title: 'Mil séries', desc: 'Complete 1.000 séries', target: 1000, value: (s) => s.sets },
  { id: 'vol10k', icon: '🏋️', title: 'Dez toneladas', desc: 'Levante 10.000 kg no total', target: 10000, value: (s) => s.volume },
  { id: 'vol100k', icon: '🦍', title: 'Cem toneladas', desc: 'Levante 100.000 kg no total', target: 100000, value: (s) => s.volume },
  { id: 'vol500k', icon: '🌋', title: 'Força da natureza', desc: 'Levante 500.000 kg no total', target: 500000, value: (s) => s.volume },
  { id: 'pr1', icon: '🏆', title: 'Novo limite', desc: 'Bata seu primeiro recorde', target: 1, value: (s) => s.prs },
  { id: 'pr10', icon: '⭐', title: 'Quebra-recordes', desc: 'Bata 10 recordes', target: 10, value: (s) => s.prs },
  { id: 'pr25', icon: '👑', title: 'Máquina de recordes', desc: 'Bata 25 recordes', target: 25, value: (s) => s.prs },
  { id: 'wk1', icon: '📅', title: 'Semana cumprida', desc: 'Bata a meta de dias em uma semana', target: 1, value: (s) => s.weeksOnGoal },
  { id: 'wk4', icon: '📆', title: 'Mês de foco', desc: 'Bata a meta de dias em 4 semanas', target: 4, value: (s) => s.weeksOnGoal },
  { id: 'wst4', icon: '🔗', title: 'Corrente firme', desc: '4 semanas seguidas na meta', target: 4, value: (s) => s.bestWeekStreak },
  { id: 'diet7', icon: '🥗', title: 'Dieta em dia', desc: 'Fique na meta de calorias em 7 dias', target: 7, value: (s) => s.dietDays },
  { id: 'log14', icon: '📝', title: 'Diário em dia', desc: 'Registre a dieta em 14 dias', target: 14, value: (s) => s.dietLogDays },
  { id: 'cardio20', icon: '🏃', title: 'Fôlego', desc: 'Faça 20 séries de cardio', target: 20, value: (s) => s.cardioSets },
]

export function isUnlocked(a: Achievement, s: Stats): boolean {
  return a.value(s) >= a.target
}