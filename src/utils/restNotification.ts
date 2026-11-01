import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { isRestSoundOn } from './restSound'

const CHANNEL_SOUND = 'fitflow-rest'
const CHANNEL_SILENT = 'fitflow-rest-silent'
const NOTIFICATION_ID = 1001

let channelsReady = false

// Cria os dois canais: um com som e vibração, outro sem apito
async function createChannels(): Promise<void> {
  if (channelsReady) return
  await LocalNotifications.createChannel({
    id: CHANNEL_SOUND,
    name: 'Fim do descanso',
    description: 'Avisa quando o descanso entre as séries termina',
    importance: 5,
    visibility: 1,
    vibration: true,
  })
  await LocalNotifications.createChannel({
    id: CHANNEL_SILENT,
    name: 'Fim do descanso (sem apito)',
    description: 'Avisa o fim do descanso sem tocar o som',
    importance: 2,
    visibility: 1,
    vibration: true,
  })
  channelsReady = true
}

export type NotificationState = 'granted' | 'denied' | 'prompt' | 'unavailable'

// Consulta a permissão sem mostrar nenhuma janela do Android
export async function notificationsState(): Promise<NotificationState> {
  if (!Capacitor.isNativePlatform()) return 'unavailable'
  try {
    const status = await LocalNotifications.checkPermissions()
    if (status.display === 'granted') return 'granted'
    if (status.display === 'denied') return 'denied'
    return 'prompt'
  } catch {
    return 'unavailable'
  }
}

// Pede a permissão (Android 13+) e prepara os canais
export async function setupNotifications(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    let status = await LocalNotifications.checkPermissions()
    if (status.display !== 'granted') status = await LocalNotifications.requestPermissions()
    if (status.display !== 'granted') return false
    await createChannels()
    return true
  } catch {
    return false
  }
}

// Só prepara os canais se a permissão já foi dada (nunca mostra a janela do Android)
export async function setupIfGranted(): Promise<boolean> {
  if ((await notificationsState()) !== 'granted') return false
  try {
    await createChannels()
    return true
  } catch {
    return false
  }
}

// Agenda o aviso para a hora em que o descanso termina. Retorna true se agendou.
export async function scheduleRestNotification(endsAt: number): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || endsAt <= Date.now()) return false
  try {
    if (!(await setupIfGranted())) return false
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] })
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: 'Descanso terminou',
          body: 'Hora da próxima série! 💪',
          channelId: isRestSoundOn() ? CHANNEL_SOUND : CHANNEL_SILENT,
          schedule: { at: new Date(endsAt), allowWhileIdle: true },
        },
      ],
    })
    return true
  } catch {
    return false
  }
}

// Cancela o aviso agendado (ainda não tocou)
export async function cancelPendingRest(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] })
  } catch {
    // sem problema
  }
}

// Remove da bandeja os avisos que já apareceram
export async function clearDeliveredRest(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.removeAllDeliveredNotifications()
  } catch {
    // sem problema
  }
}

// Cancela o agendado e limpa os que já apareceram
export async function cancelRestNotification(): Promise<void> {
  await cancelPendingRest()
  await clearDeliveredRest()
}