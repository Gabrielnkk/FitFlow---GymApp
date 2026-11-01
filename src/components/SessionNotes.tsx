import { useEffect, useRef, useState } from 'react'
import { mutateSession } from '../db/sessions'

interface Props {
  id: string
  initial: string
  lastNote?: string
}

export default function SessionNotes({ id, initial, lastNote }: Props) {
  const [text, setText] = useState(initial)
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(text)

  function save(value: string) {
    void mutateSession(id, (s) => {
      s.notes = value.trim() === '' ? undefined : value
    })
  }

  function onChange(value: string) {
    setText(value)
    latest.current = value
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => save(value), 600)
  }

  // Ao sair da tela, salva o que ainda estava pendente
  useEffect(() => {
    return () => {
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current)
        save(latest.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="mt-4 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-2 text-lg font-bold">Notas do treino</h2>
      {lastNote && (
        <p className="mb-2 rounded-lg bg-slate-900 p-3 text-sm text-slate-300">
          <b className="text-emerald-400">Da última vez:</b> {lastNote}
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          window.clearTimeout(timer.current)
          timer.current = undefined
          save(text)
        }}
        rows={3}
        placeholder="Como foi? Dor, ajuste de máquina, o que mudar..."
        className="w-full rounded-lg bg-slate-900 p-3 text-slate-50 outline-none ring-1 ring-slate-600"
      />
    </section>
  )
}