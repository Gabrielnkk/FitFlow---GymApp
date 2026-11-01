import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'
import { sessionVolume } from '../db/history'
import { formatDate, formatDuration, formatKg, formatTime } from '../utils/format'
import FrequencyCalendar from '../components/FrequencyCalendar'
import { ChevronIcon } from '../components/SettingsIcons'

function monthLabel(t: number): string {
  const s = new Date(t).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const sessions = useLiveQuery(() =>
    db.sessions
      .where('status')
      .equals('finished')
      .toArray()
      .then((list) => list.sort((a, b) => b.startedAt - a.startedAt)),
  )

  // Agrupa por mês (a lista já vem do mais novo para o mais antigo)
  const months: { label: string; items: NonNullable<typeof sessions> }[] = []
  for (const s of sessions ?? []) {
    const label = monthLabel(s.startedAt)
    const last = months[months.length - 1]
    if (last && last.label === label) last.items.push(s)
    else months.push({ label, items: [s] })
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl font-bold text-emerald-400">Histórico</h1>
      {sessions && <FrequencyCalendar sessions={sessions} />}

      {sessions && sessions.length === 0 && (
        <div className="py-10 text-center">
          <p className="mb-1 text-lg font-semibold text-slate-50">Nenhum treino finalizado</p>
          <p className="text-slate-400">Quando você finalizar um treino, ele aparece aqui.</p>
        </div>
      )}

      {months.map((m) => (
        <section key={m.label}>
          <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {m.label}
          </h2>
          <ul className="divide-y divide-slate-700/60">
            {m.items.map((s) => {
              const setsDone = s.exercises.reduce((n, e) => n + e.sets.length, 0)
              const duration = (s.finishedAt ?? s.startedAt) - s.startedAt
              return (
                <li key={s.id}>
                  <button
                    onClick={() => navigate(`/historico/${s.id}`)}
                    className="flex w-full items-center gap-3 py-3.5 text-left active:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium text-slate-50">
                        {s.name}
                      </span>
                      <span className="block text-sm text-slate-400">
                        {formatDate(s.startedAt)} · {formatTime(s.startedAt)}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {formatDuration(duration)} · {setsDone} séries · {formatKg(sessionVolume(s))} kg
                      </span>
                    </span>
                    <span className="shrink-0 text-slate-500">
                      <ChevronIcon />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}