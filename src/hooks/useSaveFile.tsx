// made by: Gabriel Mattos
import { useState } from 'react'
import type { ReactNode } from 'react'
import Modal from '../components/Modal'
import { canShareFile, markSaved, saveTextFile, shareFile } from '../utils/files'

export type SaveOutcome = 'saved' | 'cancelled' | 'pending'

/**
 * Salva um arquivo de texto (backup, CSV) de um jeito que funciona em qualquer aparelho.
 * 'pending' = o arquivo está pronto e a janela mostra um botão para você tocar e escolher onde salvar.
 * Coloque o "dialog" no final do que a tela devolve.
 */
export function useSaveFile(onSaved?: (filename: string) => void) {
  const [pending, setPending] = useState<{ file: File; text: string } | null>(null)
  const [note, setNote] = useState('')

  async function save(filename: string, text: string): Promise<SaveOutcome> {
    setNote('')
    const result = await saveTextFile(filename, text)
    if (result.status === 'needs-tap') {
      setPending({ file: result.file, text: result.text })
      return 'pending'
    }
    return result.status
  }

  function close() {
    setPending(null)
    setNote('')
  }

  // Este é o toque que o iPhone exige: o share é a primeira coisa que acontece aqui
  async function confirm() {
    if (!pending) return
    const result = await shareFile(pending.file, 'Arquivo do FitFlow')
    if (result === 'saved') {
      markSaved(pending.file.name)
      const name = pending.file.name
      close()
      onSaved?.(name)
    } else if (result === 'failed') {
      setNote('Não foi possível abrir a janela de salvar. Tente de novo.')
    }
  }

  async function copy() {
    if (!pending) return
    try {
      await navigator.clipboard.writeText(pending.text)
      setNote('Conteúdo copiado. Cole em um app de notas para guardar.')
    } catch {
      setNote('Não foi possível copiar.')
    }
  }

  const dialog: ReactNode = pending ? (
    <Modal title="Salvar arquivo" onClose={close}>
      <p className="mb-1 text-sm text-slate-300">Seu arquivo está pronto:</p>
      <p className="mb-3 break-all font-semibold">{pending.file.name}</p>
      {canShareFile(pending.file) ? (
        <>
          <p className="mb-4 text-sm text-slate-300">
            Toque no botão e escolha “Salvar em Arquivos” (ou mande para o Drive ou WhatsApp).
          </p>
          <button
            onClick={() => void confirm()}
            className="w-full rounded-xl bg-emerald-500 py-3 text-base font-bold text-white"
          >
            Salvar arquivo
          </button>
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-300">
            Este aparelho não consegue salvar o arquivo direto. Você pode copiar o conteúdo e colar em um app de notas.
          </p>
          <button
            onClick={() => void copy()}
            className="w-full rounded-xl bg-slate-700 py-3 text-base font-bold text-white"
          >
            Copiar conteúdo
          </button>
        </>
      )}
      {note && <p className="mt-3 text-center text-sm text-slate-300">{note}</p>}
    </Modal>
  ) : null

  return { save, dialog }
}
