import { Capacitor, registerPlugin } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

// Ponte para o código Android (NativeTimerPlugin.java). No navegador não faz nada.
interface NativeTimerPlugin {
  show(options: {
    id: number
    title: string
    text: string
    when: number
    countDown: boolean
  }): Promise<void>
  hide(options: { id: number }): Promise<void>
}

const NativeTimer = registerPlugin<NativeTimerPlugin>('NativeTimer')

export const LIVE_IDS = { workout: 7001, rest: 7002, timed: 7003 } as const

async function hasPermission(): Promise<boolean> {
  try {
    let p = await LocalNotifications.checkPermissions()
    if (p.display === 'prompt' || p.display === 'prompt-with-rationale') {
      p = await LocalNotifications.requestPermissions()
    }
    return p.display === 'granted'
  } catch {
    return false
  }
}

export async function showLiveTimer(options: {
  id: number
  title: string
  text: string
  when: number // instante (em ms) de fim, se for contagem regressiva; de início, se for progressiva
  countDown: boolean
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  // sem permissão de notificações o Android não mostra o cronômetro; o treino segue normal
  if (!(await hasPermission())) return
  try {
    await NativeTimer.show(options)
  } catch {
    // o cronômetro na tela de bloqueio é um extra: se falhar, o treino não pode parar
  }
}

export async function hideLiveTimer(id: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await NativeTimer.hide({ id })
  } catch {
    // nada a fazer
  }
}

export function hideAllLiveTimers(): void {
  void hideLiveTimer(LIVE_IDS.workout)
  void hideLiveTimer(LIVE_IDS.rest)
  void hideLiveTimer(LIVE_IDS.timed)
}