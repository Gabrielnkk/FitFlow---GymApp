import type { Exercise, WorkoutExercise } from '../types'
import { getProfile } from '../utils/profile'
import { resolveModel } from './online'

export interface GeneratedWorkout {
  name: string
  items: WorkoutExercise[]
  skipped: string[] // nomes que a IA citou e não existem na sua lista
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findExercise(name: string, all: Exercise[]): Exercise | undefined {
  const n = normalize(name)
  if (!n) return undefined
  return (
    all.find((e) => normalize(e.name) === n) ??
    all.find((e) => normalize(e.name).includes(n) || n.includes(normalize(e.name)))
  )
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, Math.round(n)))
}

interface RawWorkout {
  name?: unknown
  items?: { exercise?: unknown; sets?: unknown; reps?: unknown; rest?: unknown; seconds?: unknown }[]
}

export async function generateWorkout(
  apiKey: string,
  request: string,
  exercises: Exercise[],
): Promise<GeneratedWorkout> {
  const profile = getProfile()
  const profileText = [
    profile.experience ? `nível: ${profile.experience}` : '',
    profile.sex ? `sexo: ${profile.sex === 'm' ? 'masculino' : 'feminino'}` : '',
    profile.age ? `idade: ${profile.age}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  const names = exercises.map((e) => `${e.name}${e.mode === 'time' ? ' (por tempo)' : ''}`)

  const system = [
    'Você monta treinos de musculação para o app FitFlow.',
    'Responda SOMENTE com JSON, sem texto extra, neste formato:',
    '{"name":"nome curto do treino","items":[{"exercise":"nome exato da lista","sets":3,"reps":10,"rest":90}]}',
    'Regras: use apenas exercícios da lista abaixo, com o nome exatamente igual; entre 4 e 9 exercícios;',
    'sets de 2 a 5; reps de 5 a 20; rest em segundos (30 a 180); ordene dos exercícios compostos para os isoladores.',
    'Para exercícios marcados "(por tempo)", use "seconds" (20 a 120) no lugar de "reps".',
    profileText ? `Perfil do usuário: ${profileText}.` : '',
    '',
    'Lista de exercícios disponíveis:',
    names.join('; '),
  ]
    .filter((l) => l !== '')
    .join('\n')

  let response: Response
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${await resolveModel(apiKey)}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: request }] }],
          generationConfig: { maxOutputTokens: 2048, responseMimeType: 'application/json' },
        }),
      },
    )
  } catch {
    throw new Error('Sem conexão com a internet.')
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Chave de API inválida ou sem permissão.')
    }
    if (response.status === 429) {
      throw new Error('Limite de uso do Gemini atingido. Tente de novo em instantes.')
    }
    throw new Error(`Erro ${response.status} ao falar com a IA.`)
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')

  let raw: RawWorkout
  try {
    raw = JSON.parse(text.replace(/^```(?:json)?|```$/g, '').trim()) as RawWorkout
  } catch {
    throw new Error('A IA respondeu num formato inesperado. Tente de novo.')
  }

  const items: WorkoutExercise[] = []
  const skipped: string[] = []
  for (const it of raw.items ?? []) {
    const ex = findExercise(String(it.exercise ?? ''), exercises)
    if (!ex) {
      if (it.exercise) skipped.push(String(it.exercise))
      continue
    }
    if (items.some((x) => x.exerciseId === ex.id)) continue
    const isTime = ex.mode === 'time'
    items.push({
      exerciseId: ex.id,
      sets: clamp(it.sets, 1, 6, 3),
      targetReps: isTime ? 0 : clamp(it.reps, 1, 30, 10),
      restSeconds: clamp(it.rest, 0, 300, 90),
      targetSeconds: isTime ? clamp(it.seconds, 10, 600, 30) : undefined,
    })
  }

  if (items.length === 0) throw new Error('A IA não montou um treino com os seus exercícios. Tente de novo.')
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 40) : 'Treino da IA'
  return { name, items, skipped }
}