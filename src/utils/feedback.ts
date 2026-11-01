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
    if (audioCtx.state === 'suspended') void audioCtx.resume()
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
    beep(880, 0, 0.2)
    beep(880, 0.3, 0.2)
    beep(1175, 0.6, 0.4)
  } catch {
    // sem som, sem problema
  }
}