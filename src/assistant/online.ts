// made by: Gabriel Mattos
import { cleanApiKey } from './config'
import { sessionVolume } from '../db/history'
import { buildSummaries } from '../db/progress'
import type { Session } from '../types'
import { formatKg } from '../utils/format'
import { BODY_FIELDS } from '../db/body'
import type { BodyEntry } from '../types'

export const MODEL = 'gemini-2.5-flash'
const MODEL_CACHE = 'fitflow-ai-model'
const WEEK = 7 * 24 * 60 * 60 * 1000

function versionOf(name: string): number {
  const m = /gemini-(\d+(?:\.\d+)?)-flash$/.exec(name)
  return m ? parseFloat(m[1]) : 0
}

/** Pergunta ao Google quais modelos existem hoje e escolhe o Flash mais novo (modelos antigos são aposentados). */
export async function resolveModel(apiKey: string, force = false): Promise<string> {
  try {
    if (!force) {
      const saved = JSON.parse(localStorage.getItem(MODEL_CACHE) ?? 'null') as { name: string; at: number } | null
      if (saved && Date.now() - saved.at < WEEK) return saved.name
    }
  } catch {
    // sem cache
  }
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
      headers: { 'x-goog-api-key': cleanApiKey(apiKey) },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const data = (await res.json()) as {
        models?: { name?: string; supportedGenerationMethods?: string[] }[]
      }
      const names = (data.models ?? [])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => (m.name ?? '').replace(/^models\//, ''))
        .filter((n) => versionOf(n) > 0)
        .sort((a, b) => versionOf(b) - versionOf(a))
      if (names[0]) {
        try {
          localStorage.setItem(MODEL_CACHE, JSON.stringify({ name: names[0], at: Date.now() }))
        } catch {
          // sem cache
        }
        return names[0]
      }
    }
  } catch {
    // sem lista: usa o apelido que o Google mantém sempre atualizado
  }
  return 'gemini-flash-latest'
}

function rememberModel(name: string): void {
  try {
    localStorage.setItem(MODEL_CACHE, JSON.stringify({ name, at: Date.now() }))
  } catch {
    // sem cache
  }
}

function forgetModel(): void {
  try {
    localStorage.removeItem(MODEL_CACHE)
  } catch {
    // sem cache
  }
}

// Cada tentativa espera no máximo isto; passou, desiste e tenta o próximo modelo
export const ATTEMPT_TIMEOUT_MS = 15000
// Depois disso não começa tentativa nova (evita esperar minutos no total)
const TOTAL_BUDGET_MS = 20000
// O "lite" responde mais rápido e é o primeiro; os outros ficam de reserva
const FAST_MODEL = 'gemini-flash-lite-latest'

function modelOrder(resolved: string): string[] {
  return [...new Set([FAST_MODEL, resolved, 'gemini-flash-latest'])]
}

function isTimeout(err: unknown): boolean {
  return err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.clone().json()) as { error?: { message?: string } }
    return body.error?.message ?? ''
  } catch {
    return ''
  }
}

/** Chamada única ao Gemini com reserva: limite de 15 s por tentativa e troca de modelo se um travar ou sumir. */
export async function postGemini(apiKey: string, body: unknown): Promise<Response> {
  const key = cleanApiKey(apiKey)
  const resolved = await resolveModel(key)
  const started = Date.now()
  let res: Response | null = null
  let timedOut = false

  for (const model of modelOrder(resolved)) {
    if (Date.now() - started > TOTAL_BUDGET_MS) break
    // primeiro sem "pensar" (resposta mais rápida); se o Google recusar esse campo (400), tenta sem ele
    for (const withThinking of [true, false]) {
      const payload =
        withThinking && typeof body === 'object' && body !== null
          ? {
              ...(body as Record<string, unknown>),
              generationConfig: {
                ...((body as { generationConfig?: object }).generationConfig ?? {}),
                thinkingConfig: { thinkingBudget: 0 },
              },
            }
          : body
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
          },
        )
      } catch (err) {
        if (isTimeout(err)) {
          timedOut = true
          res = null
          break // este modelo travou: vai para o próximo
        }
        if (!navigator.onLine) throw new Error('Sem conexão com a internet.', { cause: err })
        throw new Error(
          `Não consegui falar com o Gemini (${err instanceof Error ? err.message : 'erro de rede'}). Verifique a internet.`,
          { cause: err },
        )
      }
      if (res.ok) {
        if (model !== FAST_MODEL) rememberModel(model)
        return res
      }
      if (res.status === 400 && withThinking && !/api key/i.test(await errorDetail(res))) continue
      break
    }
    if (res?.status === 404) forgetModel()
    // só tenta outro modelo se este não existe, está sobrecarregado ou travou
    if (res && ![404, 429, 503, 500].includes(res.status)) break
  }

  if (res) return res
  if (timedOut) {
    throw new Error(
      `O Gemini não respondeu em ${ATTEMPT_TIMEOUT_MS / 1000} s. Tente de novo em instantes ou confira sua internet.`,
    )
  }
  throw new Error('Sem resposta do Gemini.')
}

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
  const send = (model: string, withThinking: boolean) =>
    fetch(url(model), {
      signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS), // não fica "Pensando..." para sempre
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: toContents(history),
        generationConfig: {
          maxOutputTokens: 2048,
          ...(withThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
    })

  let response: Response | null = null
  let lastDetail = ''
  let lastModel = ''
  // tenta o modelo principal e, se ele falhar por motivo do modelo, os reservas
  const models = modelOrder(await resolveModel(key))
  let timedOut = false
  for (let mi = 0; mi < models.length; mi++) {
    const model = models[mi]
    lastModel = model
    for (const withThinking of [true, false]) {
      try {
        response = await send(model, withThinking)
      } catch (err) {
        if (isTimeout(err)) {
          timedOut = true
          response = null
          break // este modelo travou: tenta o próximo
        }
        if (!navigator.onLine) throw new Error('Sem conexão com a internet.', { cause: err })
        throw new Error(
          `Não consegui falar com o Gemini (${err instanceof Error ? err.message : 'erro de rede'}). Verifique a internet e se a chave tem só letras e números.`,
          { cause: err },
        )
      }
      if (response.ok) {
        if (model !== FAST_MODEL) rememberModel(model)
        break
      }
      let detail = ''
      try {
        const body = (await response.clone().json()) as { error?: { message?: string } }
        detail = body.error?.message ?? ''
      } catch {
        // sem detalhes
      }
      lastDetail = detail
      // o Google diz no próprio erro qual modelo usar no lugar ("use models/gemini-X-flash")
      const hint = /models\/(gemini[\w.-]+)\s+for the latest/i.exec(detail)?.[1]
      if (response.status === 404 && hint && !models.includes(hint)) models.splice(mi + 1, 0, hint)
      // 400 por causa do thinkingConfig: tenta de novo sem ele
      if (response.status === 400 && withThinking && !/api key/i.test(detail)) continue
      break
    }
    if (response?.ok) break
    if (response?.status === 404) forgetModel()
    // só tenta outro modelo se este não existe ou está sobrecarregado
    if (response && ![404, 429, 503, 500].includes(response.status)) break
  }

  if (timedOut && !response?.ok) {
    throw new Error(
      `O Gemini não respondeu em ${ATTEMPT_TIMEOUT_MS / 1000} s. Tente de novo em instantes ou confira sua internet.`,
    )
  }
  if (!response) throw new Error('Sem resposta do Gemini.')
  if (!response.ok) {
    const detail = lastDetail
    if (response.status === 401 || response.status === 403 || /api key/i.test(detail)) {
      throw new Error(`Chave de API inválida ou sem permissão.${detail ? ` (${detail})` : ''}`)
    }
    if (response.status === 429) {
      throw new Error(
        `Limite de uso do Gemini atingido (${lastModel}). Espere 1 minuto e tente de novo.${detail ? ` Detalhe: ${detail.slice(0, 220)}` : ''}`,
      )
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