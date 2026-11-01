import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { setupNotifications } from './restNotification'

const KEY = 'fitflow-reminder'
const CHANNEL = 'fitflow-reminder'
const BASE_ID = 2000 // 2001 a 2007, um para cada dia da semana

export interface ReminderConfig {
  on: boolean
  hour: number
  minute: number
  days: number[] // 0 = domingo ... 6 = sábado
}

export const DEFAULT_REMINDER: ReminderConfig = { on: false, hour: 18, minute: 0, days: [1, 3, 5] }

export function getReminder(): ReminderConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_REMINDER
    const p = JSON.parse(raw) as Partial<ReminderConfig>
    return {
      on: Boolean(p.on),
      hour: typeof p.hour === 'number' ? p.hour : 18,
      minute: typeof p.minute === 'number' ? p.minute : 0,
      days: Array.isArray(p.days) ? p.days.filter((d) => d >= 0 && d <= 6) : [1, 3, 5],
    }
  } catch {
    return DEFAULT_REMINDER
  }
}

function saveReminder(cfg: ReminderConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg))
  } catch {
    // sem problema
  }
}

const MESSAGES = [
  'Hora de treinar! Seu treino está te esperando 💪',
  'Bora? Um treino hoje deixa você mais perto da meta 🔥',
  'Separe a toalha e a garrafa: é dia de treino!',
]

/**
 * Salva a configuração e reagenda os lembretes semanais.
 * Retorna false se ligou o lembrete mas não conseguiu agendar (sem permissão, por exemplo).
 */
export async function applyReminder(cfg: ReminderConfig): Promise<boolean> {
  saveReminder(cfg)
  if (!Capacitor.isNativePlatform()) return !cfg.on
  try {
    await LocalNotifications.cancel({
      notifications: Array.from({ length: 7 }, (_, i) => ({ id: BASE_ID + 1 + i })),
    })
    if (!cfg.on || cfg.days.length === 0) return true
    if (!(await setupNotifications())) return false
    await LocalNotifications.createChannel({
      id: CHANNEL,
      name: 'Lembrete de treino',
      description: 'Lembra você de treinar nos dias escolhidos',
      importance: 4,
      visibility: 1,
      vibration: true,
    })
    await LocalNotifications.schedule({
      notifications: cfg.days.map((d) => ({
        id: BASE_ID + 1 + d,
        title: 'FitFlow',
        body: MESSAGES[d % MESSAGES.length],
        channelId: CHANNEL,
        schedule: {
          on: { weekday: d + 1, hour: cfg.hour, minute: cfg.minute }, // no Capacitor: 1 = domingo
          allowWhileIdle: true,
        },
      })),
    })
    return true
  } catch {
    return false
  }
}