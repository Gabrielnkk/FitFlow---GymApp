const LAST_KEY = 'fitflow-last-backup'
const SNOOZE_KEY = 'fitflow-backup-snooze'
const FIRST_KEY = 'fitflow-first-seen'
const LIMIT_DAYS = 7
const DAY = 24 * 60 * 60 * 1000

function read(key: string): number | null {
  try {
    const n = parseInt(localStorage.getItem(key) ?? '', 10)
    return Number.isNaN(n) ? null : n
  } catch {
    return null
  }
}

function write(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // sem armazenamento, sem problema
  }
}

export function markBackupDone(): void {
  write(LAST_KEY, Date.now())
}

export function lastBackupAt(): number | null {
  return read(LAST_KEY)
}

export function snoozeBackupReminder(): void {
  write(SNOOZE_KEY, Date.now() + DAY)
}

// Se nunca fez backup, conta a partir da primeira vez que o app abriu com este recurso
export function shouldRemindBackup(): boolean {
  const now = Date.now()
  if (read(FIRST_KEY) === null) write(FIRST_KEY, now)
  const snooze = read(SNOOZE_KEY)
  if (snooze !== null && now < snooze) return false
  const base = lastBackupAt() ?? read(FIRST_KEY) ?? now
  return now - base >= LIMIT_DAYS * DAY
}

export function daysSince(ms: number): number {
  return Math.floor((Date.now() - ms) / DAY)
}