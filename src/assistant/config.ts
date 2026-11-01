const KEY_NAME = 'fitflow-ai-key'
const MODE_NAME = 'fitflow-ai-mode'

export type AssistantMode = 'offline' | 'online'

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_NAME) ?? ''
  } catch {
    return ''
  }
}

export function setApiKey(value: string): void {
  try {
    if (value) localStorage.setItem(KEY_NAME, value)
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