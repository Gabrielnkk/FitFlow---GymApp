import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { answerOffline, SUGGESTIONS } from '../assistant/offline'
import { askOnline, buildContext } from '../assistant/online'
import { getApiKey, getMode, setMode, type AssistantMode } from '../assistant/config'

interface Message {
  role: 'user' | 'assistant'
  text: string
  online?: boolean
}

const WELCOME: Message = {
  role: 'assistant',
  text: 'Oi! Sou o assistente do FitFlow. Pergunte sobre o app ou sobre o seu treino, ou toque numa sugestão abaixo.',
}

export default function AssistantPage() {
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const sessions = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray())
    const body = useLiveQuery(() => db.bodyEntries.toArray())
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [apiKey] = useState(getApiKey)
  const [mode, setModeState] = useState<AssistantMode>(getMode)
  const endRef = useRef<HTMLDivElement>(null)

  const useOnline = mode === 'online' && apiKey !== ''

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  function changeMode(next: AssistantMode) {
    if (next === 'online' && !apiKey) {
      window.alert('Para usar a IA online, cadastre a sua chave em Ajustes > Assistente IA.')
      return
    }
    setModeState(next)
    setMode(next)
  }

  async function send(raw: string) {
    const text = raw.trim()
    if (!text || busy || !exercises || !sessions) return

    setInput('')
    const next: Message[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setBusy(true)

    let reply: string
    let online = false
    if (useOnline) {
      try {
        reply = await askOnline(
          apiKey,
          next.map((m) => ({ role: m.role, text: m.text })),
                    buildContext(sessions, body ?? []),
        )
        online = true
      } catch (err) {
        const why = err instanceof Error ? err.message : 'falha desconhecida'
        reply = `(IA online indisponível: ${why} Respondi pelo modo offline.)\n\n${answerOffline(text, { exercises, sessions })}`
      }
    } else {
      reply = answerOffline(text, { exercises, sessions, bodyEntries: body ?? [] })
    }

    setMessages((m) => [...m, { role: 'assistant', text: reply, online }])
    setBusy(false)
  }

  return (
    <div className="p-4 pb-40">
      <h1 className="mb-3 text-3xl font-bold text-emerald-400">Assistente</h1>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {(
          [
            ['offline', 'Offline'],
            ['online', 'IA online'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => changeMode(key)}
            className={`rounded-xl py-3 text-base font-semibold ${
              (key === 'online') === useOnline
                ? 'bg-emerald-500 text-slate-900'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-base ${
                m.role === 'user' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-50'
              }`}
            >
              {m.text}
              {m.online && <div className="mt-1 text-xs text-slate-400">IA online</div>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-800 px-4 py-3 text-slate-400">Pensando...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div
        className="fixed inset-x-0 z-30 border-t border-slate-700 bg-slate-900"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-md">
          <div className="flex gap-2 overflow-x-auto px-3 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={busy}
                className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-sm text-slate-300 active:bg-slate-700 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              className="min-w-0 flex-1 rounded-xl bg-slate-800 px-4 py-3 text-base outline-none ring-1 ring-slate-600 focus:ring-emerald-400"
              placeholder="Pergunte algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-emerald-500 px-5 text-lg font-bold text-slate-900 disabled:opacity-50"
            >
              ➤
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}