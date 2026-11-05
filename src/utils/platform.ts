// made by: Gabriel Mattos

/** true no iPhone/iPad (Safari ou app instalado na tela de início) */
export function isIos(): boolean {
  const ua = navigator.userAgent
  // iPad novo se apresenta como "Mac", mas tem tela de toque
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
