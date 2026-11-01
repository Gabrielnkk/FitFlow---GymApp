const KEY = 'fitflow-tutorial-done'

export const TUTORIAL_EVENT = 'fitflow-tutorial-open'

export function isTutorialDone(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

export function markTutorialDone(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // sem armazenamento, sem problema
  }
}

// Usado pelo botão "Rever tutorial" dos Ajustes
export function openTutorial(): void {
  window.dispatchEvent(new Event(TUTORIAL_EVENT))
}