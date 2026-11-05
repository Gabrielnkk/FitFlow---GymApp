// made by: Gabriel Mattos
import { useState } from 'react'
import { bodyCsv, sessionsCsv } from '../utils/csv'
import { daysSince, lastBackupAt } from '../utils/backupReminder'
import { useSaveFile } from '../hooks/useSaveFile'

function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function BackupTools() {
  const [msg, setMsg] = useState('')
  const last = lastBackupAt()
  const { save, dialog } = useSaveFile(() => setMsg('Arquivo salvo.'))

  async function run(kind: 'treinos' | 'corpo') {
    try {
      const text = kind === 'treinos' ? await sessionsCsv() : await bodyCsv()
      const result = await save(`fitflow-${kind}-${stamp()}.csv`, text)
      if (result === 'saved') setMsg('Arquivo salvo.')
      else if (result === 'cancelled') setMsg('Exportação cancelada.')
      else setMsg('Arquivo pronto. Toque em "Salvar arquivo" para escolher onde guardar.')
    } catch {
      setMsg('Não consegui gerar o arquivo.')
    }
  }

  return (
    <section className="mb-5 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-1 text-lg font-bold">Lembrete e planilhas</h2>
      <p className="mb-3 text-sm text-slate-300">
        {last === null
          ? 'Você ainda não exportou nenhum backup neste app.'
          : `Último backup: há ${daysSince(last)} dia(s).`}
      </p>
      <div className="flex gap-2">
        <button onClick={() => run('treinos')} className="flex-1 rounded-lg bg-emerald-500 p-3 font-bold">
          CSV dos treinos
        </button>
        <button onClick={() => run('corpo')} className="flex-1 rounded-lg bg-emerald-500 p-3 font-bold">
          CSV do corpo
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-slate-300">{msg}</p>}
      {dialog}
    </section>
  )
}