// made by: Gabriel Mattos
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { markBackupDone } from './backupReminder'
import { isIos } from './platform'

// 'needs-tap' = o iPhone só abre a janela de salvar logo depois de um toque seu,
// e o arquivo demorou para ficar pronto. A tela mostra um botão para você tocar de novo.
export type SaveResult =
  | { status: 'saved' | 'cancelled' }
  | { status: 'needs-tap'; file: File; text: string }

function mimeOf(filename: string): string {
  if (filename.endsWith('.csv')) return 'text/csv'
  if (filename.endsWith('.json')) return 'application/json'
  return 'text/plain'
}

/** Cria o arquivo. Se o navegador não aceitar compartilhar o tipo exato, usa texto simples (mesmo nome). */
function makeFile(filename: string, text: string): File {
  const files = [mimeOf(filename), 'text/plain'].map((type) => new File([text], filename, { type }))
  return files.find((f) => navigator.canShare?.({ files: [f] })) ?? files[0]
}

export function canShareFile(file: File): boolean {
  return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [file] })
}

/** Abre a janela de compartilhar do sistema. Precisa ser chamada logo depois de um toque (sem "await" antes). */
export async function shareFile(file: File, title: string): Promise<'saved' | 'cancelled' | 'failed'> {
  try {
    await navigator.share({ files: [file], title })
    return 'saved'
  } catch (err) {
    // AbortError = você fechou a janela de compartilhar
    return err instanceof DOMException && err.name === 'AbortError' ? 'cancelled' : 'failed'
  }
}

// Download clássico: funciona no computador e no Chrome do Android, mas NÃO no iPhone
function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Só chame quando o arquivo realmente foi entregue: o lembrete de backup se baseia nisso. */
export function markSaved(filename: string): void {
  if (filename.startsWith('fitflow-backup')) markBackupDone()
}

export async function saveTextFile(filename: string, text: string): Promise<SaveResult> {
  // APK Android: grava no cache e abre a janela de compartilhar do Android
  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    try {
      await Share.share({ title: 'Arquivo do FitFlow', url: written.uri, dialogTitle: 'Salvar arquivo' })
    } catch {
      return { status: 'cancelled' } // você fechou a janela de compartilhar
    }
    markSaved(filename)
    return { status: 'saved' }
  }

  const file = makeFile(filename, text)

  // iPhone (Safari ou app instalado): o download clássico é ignorado, então usa a janela de compartilhar
  if (isIos()) {
    if (canShareFile(file)) {
      const result = await shareFile(file, 'Arquivo do FitFlow')
      if (result === 'saved') {
        markSaved(filename)
        return { status: 'saved' }
      }
      if (result === 'cancelled') return { status: 'cancelled' }
    }
    return { status: 'needs-tap', file, text }
  }

  downloadFile(file)
  markSaved(filename)
  return { status: 'saved' }
}
