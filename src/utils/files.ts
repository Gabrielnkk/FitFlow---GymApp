import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { markBackupDone } from './backupReminder'

// Retorna true se o arquivo foi entregue, false se você cancelou
async function saveTextFileRaw(filename: string, text: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    try {
      await Share.share({
        title: 'Backup do FitFlow',
        url: written.uri,
        dialogTitle: 'Salvar backup',
      })
      return true
    } catch {
      return false // você fechou a janela de compartilhar
    }
  }

  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return true
}
export async function saveTextFile(filename: string, text: string): Promise<boolean> {
  const ok = await saveTextFileRaw(filename, text)
  if (ok && filename.startsWith('fitflow-backup')) markBackupDone()
  return ok
}