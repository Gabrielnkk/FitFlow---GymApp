import { resolveModel } from './online'

export interface EstimatedFood {
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isNaN(n) || n < 0 ? 0 : Math.round(n * 10) / 10
}

/** Reduz a foto (lado maior = 768 px) e devolve só o texto base64 do JPEG. */
export async function imageToBase64(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Não consegui abrir essa foto.'))
      el.src = url
    })
    const scale = Math.min(1, 768 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não consegui preparar a foto.')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function estimateFood(
  apiKey: string,
  text: string,
  imageBase64?: string,
): Promise<EstimatedFood[]> {
  const system = [
    'Você estima calorias e macronutrientes de refeições para o app FitFlow, usando a culinária brasileira como referência.',
    'Responda SOMENTE com JSON, sem texto extra, neste formato:',
    '{"items":[{"name":"Arroz branco (150 g)","kcal":195,"protein":4,"carbs":42,"fat":0.4}]}',
    'Regras: um item por alimento; coloque a quantidade estimada no nome; kcal em kcal e os macros em gramas;',
    'se o usuário não disser a quantidade, assuma uma porção comum; no máximo 12 itens.',
  ].join('\n')

  const parts: Record<string, unknown>[] = []
  if (imageBase64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } })
  parts.push({
    text: text.trim() || 'Identifique os alimentos da foto e estime a porção de cada um.',
  })

  let response: Response
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${await resolveModel(apiKey)}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts }],
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
  const out = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')

  let raw: { items?: Record<string, unknown>[] }
  try {
    raw = JSON.parse(out.replace(/^```(?:json)?|```$/g, '').trim()) as typeof raw
  } catch {
    throw new Error('A IA respondeu num formato inesperado. Tente de novo.')
  }

  const items = (raw.items ?? [])
    .map((it) => ({
      name: String(it.name ?? '').trim().slice(0, 60),
      kcal: Math.round(num(it.kcal)),
      protein: num(it.protein),
      carbs: num(it.carbs),
      fat: num(it.fat),
    }))
    .filter((it) => it.name !== '')
  if (items.length === 0) throw new Error('A IA não identificou nenhum alimento. Tente descrever melhor.')
  return items
}