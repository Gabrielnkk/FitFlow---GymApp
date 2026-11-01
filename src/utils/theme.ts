const KEY = 'fitflow-theme'

export type ThemeChoice = 'dark' | 'light' | 'auto'

export function getTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'auto' ? v : 'dark'
  } catch {
    return 'dark'
  }
}

function systemPrefersLight(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches
}

/** Aplica o tema na página inteira (a marca fica no <html>). */
export function applyTheme(choice: ThemeChoice = getTheme()): void {
  const light = choice === 'light' || (choice === 'auto' && systemPrefersLight())
  document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark')
}

export function setTheme(choice: ThemeChoice): void {
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    // sem armazenamento, sem problema
  }
  applyTheme(choice)
}