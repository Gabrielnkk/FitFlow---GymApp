import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/database'
import { bestSeconds, bestWeight, findPrevious, sessionVolume } from '../db/history'
import type { SessionExercise, SessionSet } from '../types'
import { formatDate, formatDuration, formatKg, formatTime } from '../utils/format'
import { isWorkingSet, kindLabel } from '../utils/sets'
import ShareSummaryButton from '../components/ShareSummaryButton'
import { BackIcon } from '../components/SettingsIcons'

function setText(ex: SessionExercise, st: SessionSet): string {
  if (ex.mode === 'time') {
    return `${st.seconds ?? 0} s${st.weight > 0 ? ` (+${formatKg(st.weight)} kg)` : ''}`
  }
  return `${formatKg(st.weight)} kg × ${st.reps}`
}

function compactText(ex: SessionExercise, st: SessionSet): string {
  if (ex.mode === 'time') return `${st.seconds ?? 0}s`
  return `${formatKg(st.weight)}×${st.reps}`
}

export default function SessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const session = useLiveQuery(() => (id ? db.sessions.get(id) : undefined), [id])
  const finished = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray())

  if (!session || !finished) return <div className="p-4 text-slate-400">Carregando...</div>

  async function handleDelete() {
    if (!id) return
    if (window.confirm('Excluir este treino do histórico? Isso não pode ser desfeito.')) {
      await db.sessions.delete(id)
      navigate('/historico')
    }
  }

  const duration = (session.finishedAt ?? session.startedAt) - session.startedAt

  return (
    <div className="p-4">
      <button
        onClick={() => navigate('/historico')}
        className="mb-3 flex items-center gap-1 text-base text-slate-400 active:opacity-60"
      >
        <BackIcon />
        Voltar
      </button>

      <h1 className="text-3xl font-bold text-emerald-400">{session.name}</h1>
      <p className="mt-1 text-slate-400">
        {formatDate(session.startedAt)} · {formatTime(session.startedAt)}
      </p>
      <p className="mb-4 text-sm text-slate-500">
        {formatDuration(duration)} · {formatKg(sessionVolume(session))} kg de volume
      </p>

      {session.notes && (
        <div className="mb-4 rounded-2xl bg-slate-800 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Anotações
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-200">{session.notes}</p>
        </div>
      )}

      <ShareSummaryButton session={session} />

      {session.exercises.map((ex, i) => {
        const prev = findPrevious(finished, session, ex.exerciseId)
        const isTime = ex.mode === 'time'
        const diff = prev
          ? isTime
            ? bestSeconds(ex) - bestSeconds(prev.exercise)
            : bestWeight(ex) - bestWeight(prev.exercise)
          : 0
        const unit = isTime ? 's' : 'kg'
        const what = isTime ? 'no melhor tempo' : 'na carga máxima'
        return (
          <section key={i}>
            <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-lg font-semibold text-slate-50">
              {ex.exerciseName}
            </h2>

            <ul className="divide-y divide-slate-700/60">
              {ex.sets.map((st, si) => (
                <li key={si} className="flex items-center justify-between py-2.5 text-slate-200">
                  <span className="text-slate-400">
                    Série {si + 1}
                    {kindLabel(st.kind) && (
                      <span className="ml-2 rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-200">
                        {kindLabel(st.kind)}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-slate-50">
                    {setText(ex, st)}
                    {st.rpe !== undefined && (
                      <span className="ml-2 text-sm font-normal text-slate-400">
                        RPE {String(st.rpe).replace('.', ',')}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-2 text-sm">
              {prev ? (
                <>
                  <div className="text-slate-400">
                    Última vez ({formatDate(prev.date)}):{' '}
                    <span className="text-slate-200">
                      {prev.exercise.sets
                        .filter(isWorkingSet)
                        .map((s) => compactText(ex, s))
                        .join(' · ')}
                    </span>
                  </div>
                  <div
                    className={`mt-1 font-semibold ${
                      diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}
                  >
                    {diff > 0 && `▲ +${formatKg(diff)} ${unit} ${what}`}
                    {diff < 0 && `▼ ${formatKg(diff)} ${unit} ${what}`}
                    {diff === 0 && `= Mesmo valor ${what}`}
                  </div>
                </>
              ) : (
                <span className="text-slate-400">Primeira vez que você registra este exercício.</span>
              )}
            </div>
          </section>
        )
      })}

      <button
        onClick={handleDelete}
        className="mt-6 w-full rounded-xl py-3 text-base font-semibold text-red-400"
      >
        Excluir treino do histórico
      </button>
    </div>
  )
}