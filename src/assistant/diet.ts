import type { Profile } from '../utils/profile'
import { postGemini } from './online'
import type { Macros } from '../db/nutrition'

export interface RecommendedFood {
  name: string
  portion: string
}

export interface RecommendedMeal extends Macros {
  name: string
  foods: RecommendedFood[]
}

export interface DietRecommendation {
  summary: string
  meals: RecommendedMeal[]
  totals: Macros
}

interface DietInput {
  profile: Profile
  latestWeight?: number
  goal: Macros | null
  preferences: string
}

function numberValue(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0
}

function readMacros(value: Record<string, unknown>): Macros {
  return {
    kcal: numberValue(value.kcal),
    protein: numberValue(value.protein),
    carbs: numberValue(value.carbs),
    fat: numberValue(value.fat),
  }
}

export async function recommendDiet(apiKey: string, input: DietInput): Promise<DietRecommendation> {
  if (input.profile.age !== undefined && input.profile.age < 18) {
    throw new Error('Recomendações de dieta para menores de 18 anos devem ser feitas com um responsável e um nutricionista.')
  }

  const userProfile = [
    input.profile.age ? `idade: ${input.profile.age} anos` : '',
    input.profile.sex ? `sexo usado no cálculo da meta: ${input.profile.sex === 'm' ? 'masculino' : 'feminino'}` : '',
    input.profile.heightCm ? `altura: ${input.profile.heightCm} cm` : '',
    input.latestWeight ? `peso mais recente registrado: ${input.latestWeight} kg` : '',
  ]
    .filter(Boolean)
    .join('; ')

  const request = [
    'Crie uma sugestão de alimentação equilibrada para um dia, usando como referência as metas e os dados disponíveis.',
    userProfile ? `Perfil disponível: ${userProfile}.` : 'Não há dados de perfil preenchidos.',
    input.goal
      ? `Meta diária estimada pelo usuário: ${input.goal.kcal} kcal, ${input.goal.protein} g de proteína, ${input.goal.carbs} g de carboidratos e ${input.goal.fat} g de gordura.`
      : 'O usuário ainda não definiu uma meta diária.',
    `Preferências, alergias ou alimentos a evitar informados pelo usuário: ${input.preferences.trim() || 'nenhuma informação fornecida'}.`,
  ].join('\n')

  const system = [
    'Você é um assistente de alimentação geral do app FitFlow, não um profissional de saúde.',
    'Responda SOMENTE com JSON válido, sem markdown, neste formato:',
    '{"summary":"orientação breve","meals":[{"name":"Café da manhã","foods":[{"name":"Aveia","portion":"40 g"},{"name":"Banana","portion":"1 unidade média"}],"kcal":400,"protein":20,"carbs":55,"fat":10}]}',
    'Crie de 3 a 5 refeições com alimentos e porções realistas, preferindo opções acessíveis e comuns no Brasil.',
    'Os números por refeição são estimativas. Se houver meta, mantenha o total aproximado sem recomendar restrição extrema ou dietas radicais. Se não houver meta, apresente apenas uma ideia equilibrada, sem inventar meta calórica pessoal.',
    'Respeite rigorosamente alergias e restrições informadas. Não recomende suplementos como necessários, nem diagnostique, trate doenças ou prescreva dietas clínicas.',
    'Se o usuário mencionar doença, gravidez, transtorno alimentar ou outra condição clínica, diga brevemente no summary que a sugestão não é adequada para essa condição e que deve buscar orientação de médico ou nutricionista.',
    'Mantenha summary curto, em português do Brasil. Todos os valores devem ser números não negativos; macros em gramas e energia em kcal.',
  ].join('\n')

  let response: Response
  try {
    response = await postGemini(apiKey, {
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: request }] }],
      generationConfig: { maxOutputTokens: 2048, responseMimeType: 'application/json' },
    })
  } catch (err) {
    throw new Error(err instanceof Error && err.message ? err.message : 'Sem conexão com a internet.', {
      cause: err,
    })
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
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('')

  let raw: {
    summary?: unknown
    meals?: {
      name?: unknown
      foods?: { name?: unknown; portion?: unknown }[]
      kcal?: unknown
      protein?: unknown
      carbs?: unknown
      fat?: unknown
    }[]
  }
  try {
    raw = JSON.parse(text.replace(/^```(?:json)?|```$/g, '').trim()) as typeof raw
  } catch {
    throw new Error('A IA respondeu num formato inesperado. Tente de novo.')
  }

  const meals = (raw.meals ?? [])
    .map((meal) => ({
      name: String(meal.name ?? '').trim().slice(0, 60),
      foods: (meal.foods ?? [])
        .map((food) => ({
          name: String(food.name ?? '').trim().slice(0, 80),
          portion: String(food.portion ?? '').trim().slice(0, 50),
        }))
        .filter((food) => food.name !== '')
        .slice(0, 10),
      ...readMacros(meal as Record<string, unknown>),
    }))
    .filter((meal) => meal.name !== '' && meal.foods.length > 0)
    .slice(0, 5)

  if (meals.length < 3) throw new Error('A IA não montou um plano utilizável. Tente novamente.')

  const totals = meals.reduce(
    (sum, meal) => ({
      kcal: sum.kcal + meal.kcal,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fat: sum.fat + meal.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return {
    summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 500) : '',
    meals,
    totals,
  }
}
