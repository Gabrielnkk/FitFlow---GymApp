const KEY_NAME = 'fitflow-ai-key'
const MODE_NAME = 'fitflow-ai-mode'

export type AssistantMode = 'offline' | 'online'

// Tira espaços, quebras de linha, aspas e caracteres invisíveis (comuns ao copiar pelo WhatsApp)
export function cleanApiKey(value: string): string {
  return value.replace(/[^\x21-\x7E]/g, '').replace(/^["'`]+|["'`]+$/g, '')
}

export function getApiKey(): string {
  try {
    return cleanApiKey(localStorage.getItem(KEY_NAME) ?? '')
  } catch {
    return ''
  }
}

export function setApiKey(value: string): void {
  try {
    const key = cleanApiKey(value)
    if (key) localStorage.setItem(KEY_NAME, key)
    else localStorage.removeItem(KEY_NAME)
  } catch {
    // sem armazenamento, sem problema
  }
}

export function getMode(): AssistantMode {
  try {
    return localStorage.getItem(MODE_NAME) === 'online' ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}

export function setMode(mode: AssistantMode): void {
  try {
    localStorage.setItem(MODE_NAME, mode)
  } catch {
    // sem armazenamento, sem problema
  }
}