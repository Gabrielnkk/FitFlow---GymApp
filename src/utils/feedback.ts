// made by: Gabriel Mattos
import { isRestSoundOn } from './restSound'

let audioCtx: AudioContext | null = null

// O navegador só libera o som depois de um toque do usuário.
// Chamamos esta função quando você toca em ✓.
export function unlockAudio() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    if (!audioCtx) audioCtx = new Ctx()
    if (audioCtx.state !== 'running') void audioCtx.resume().catch(() => {})
  } catch {
    // sem som, sem problema
  }
}

function beep(frequency: number, startAfter: number, duration: number) {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.value = 0.4
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  const t = audioCtx.currentTime + startAfter
  osc.start(t)
  osc.stop(t + duration)
}

export function alertRestEnd() {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 500])
  } catch {
    // sem vibração, sem problema
  }
  if (!isRestSoundOn()) return // apito desligado nos Ajustes: só vibra
  try {
    if (!audioCtx) unlockAudio()
    const ctx = audioCtx
    if (!ctx) return
    const play = () => {
      beep(880, 0, 0.2)
      beep(880, 0.3, 0.2)
      beep(1175, 0.6, 0.4)
    }
    // Depois de ficar em segundo plano o iPhone deixa o áudio "pausado": reativa antes de tocar.
    // Se o iPhone recusar (às vezes só libera depois de um toque), o aviso na tela continua valendo.
    if (ctx.state === 'running') play()
    else void ctx.resume().then(play).catch(() => {})
  } catch {
    // sem som, sem problema
  }
}
