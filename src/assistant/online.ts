import { cleanApiKey } from './config'
import { sessionVolume } from '../db/history'
import { buildSummaries } from '../db/progress'
import type { Session } from '../types'
import { formatKg } from '../utils/format'
import { BODY_FIELDS } from '../db/body'
import type { BodyEntry } from '../types'

export const MODEL = 'gemini-3.8-flash'
// Lista de modelos atualizada com as versões Flash mais recentes e estáveis do Google
const MODELS = [
  MODEL,
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
]

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

// Resumo curto do histórico, enviado junto com a pergunta
export function buildContext(sessions: Session[], body: BodyEntry[] = []): string {
  const bodyLines = [...body]
    .sort((a, b) => b.date - a.date)
    .slice(0, 6)
    .map((e) => {
      const date = new Date(e.date).toLocaleDateString('pt-BR')
      const parts = BODY_FIELDS.filter((f) => e[f.key] !== undefined).map(
        (f) => `${f.label} ${formatKg(e[f.key] ?? 0)} ${f.unit}`,
      )
      return `${date}: ${parts.join(', ')}`
    })
  const bodyText =
    bodyLines.length > 0
      ? `\n\nPeso e medidas corporais (mais recentes primeiro):\n${bodyLines.join('\n')}`
      : ''

  const recent = [...sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, 8)
  if (recent.length === 0) return `O usuário ainda não finalizou nenhum treino.${bodyText}`

  const lines = recent.map((s) => {
    const date = new Date(s.startedAt).toLocaleDateString('pt-BR')
    const exercises = s.exercises
      .map(
        (e) =>
          `${e.exerciseName}: ` +
          e.sets
            .map(
              (st) =>
                `${st.kind === 'warmup' ? 'aquecimento ' : ''}${e.mode === 'time' ? `${st.seconds ?? 0}s` : `${formatKg(st.weight)}x${st.reps}`}${st.rpe !== undefined ? ` @${st.rpe}` : ''}`,
            )
            .join(', '),
      )
      .join(' | ')
    return `${date} - ${s.name} (volume ${formatKg(sessionVolume(s))} kg): ${exercises}`
  })

  const prs = buildSummaries(sessions)
    .filter((s) => !s.isTime)
    .sort((a, b) => b.records.maxWeight - a.records.maxWeight)
    .slice(0, 10)
    .map((s) => `${s.name}: ${formatKg(s.records.maxWeight)} kg`)

  return (
    `Últimos treinos (peso em kg x reps @RPE):\n${lines.join('\n')}\n\n` +
    `Maiores cargas: ${prs.join('; ')}` +
    bodyText
  )
}

// O Gemini usa "user" e "model" (em vez de "assistant")
function toContents(history: ChatTurn[]) {
  const out: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
  for (const turn of history.slice(-10)) {
    const role = turn.role === 'user' ? 'user' : 'model'
    const last = out[out.length - 1]
    if (last && last.role === role) last.parts[0].text += `\n${turn.text}`
    else out.push({ role, parts: [{ text: turn.text }] })
  }
  while (out.length > 0 && out[0].role !== 'user') out.shift()
  return out
}

export async function askOnline(
  apiKey: string,
  history: ChatTurn[],
  context: string,
): Promise<string> {
  const system = [
    'Você é o assistente do FitFlow, um app pessoal de treino de musculação.',
    'Responda sempre em português do Brasil, de forma curta e direta, em texto simples, sem markdown (sem asteriscos, sem #).',
    'Ajude a usar o app e a orientar o treino com base nos dados abaixo.',
    'Você não é médico: em caso de dor, lesão ou problema de saúde, recomende procurar um profissional.',
    'Se faltar dado para responder, diga isso e peça o que falta.',
    '',
    'Dados do usuário:',
    context,
  ].join('\n')

  const key = cleanApiKey(apiKey)
  if (!key) throw new Error('Cole a chave de API do Gemini nos Ajustes.')

  const url = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  
  const send = (model: string) =>
    fetch(url(model), {
      signal: AbortSignal.timeout(40000), // não fica "Pensando..." para sempre
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: toContents(history),
        generationConfig: {
          maxOutputTokens: 2048,
        },
      }),
    })

  let response: Response | null = null
  let lastDetail = ''
  
  // tenta o modelo principal e, se ele falhar por motivo do modelo (404, 503, 500), os reservas
  for (const model of MODELS) {
    try {
      response = await send(model)
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('O Gemini demorou demais para responder (mais de 20 s). Tente de novo.')
      }
      if (!navigator.onLine) throw new Error('Sem conexão com a internet.')
      throw new Error(
        `Não consegui falar com o Gemini (${err instanceof Error ? err.message : 'erro de rede'}). Verifique a internet e se a chave tem só letras e números.`,
      )
    }
    
    if (response.ok) break
    
    let detail = ''
    try {
      const body = (await response.clone().json()) as { error?: { message?: string } }
      detail = body.error?.message ?? ''
    } catch {
      // sem detalhes
    }
    lastDetail = detail
    
    // Se o erro for de modelo não encontrado (404) ou servidor sobrecarregado (503, 500), tenta o próximo da lista
    if (![404, 503, 500].includes(response.status)) break
  }

  if (!response) throw new Error('Sem resposta do Gemini.')
  if (!response.ok) {
    const detail = lastDetail
    if (response.status === 401 || response.status === 403 || /api key/i.test(detail)) {
      throw new Error(`Chave de API inválida ou sem permissão.${detail ? ` (${detail})` : ''}`)
    }
    if (response.status === 429) {
      throw new Error('Limite de uso do Gemini atingido. Tente de novo em instantes.')
    }
    if (response.status === 503) {
      throw new Error('O Gemini está sobrecarregado agora. Tente de novo em alguns segundos.')
    }
    throw new Error(`Erro ${response.status}${detail ? `: ${detail}` : ''}`)
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    promptFeedback?: { blockReason?: string }
  }
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim()

  if (!text) {
    if (data.promptFeedback?.blockReason) throw new Error('A IA bloqueou esta pergunta.')
    throw new Error('A IA não retornou texto.')
  }
  return text
}