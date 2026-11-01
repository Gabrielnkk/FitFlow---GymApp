const KEY = 'fitflow-profile'

export type Sex = 'm' | 'f'
export type Experience = 'iniciante' | 'intermediario' | 'avancado'

export interface Profile {
  sex?: Sex
  age?: number
  heightCm?: number
  neckCm?: number
  experience?: Experience
}

export function getProfile(): Profile {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && typeof raw === 'object') return raw as Profile
  } catch {
    // sem dados salvos
  }
  return {}
}

// Junta o que mudou com o que já estava salvo
export function saveProfile(patch: Profile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getProfile(), ...patch }))
  } catch {
    // sem armazenamento, sem problema
  }
}