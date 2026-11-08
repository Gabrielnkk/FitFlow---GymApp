// made by: Gabriel Mattos
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'
import { buildSessionExercise, finishSession, mutateSession } from '../db/sessions'
import type { Exercise, SessionSet } from '../types'
import CardioSelect from '../components/CardioSelect'
import NotificationPrompt from '../components/NotificationPrompt'
import PickerSelect from '../components/PickerSelect'
import SetKindSelect from '../components/SetKindSelect'
import SessionNotes from '../components/SessionNotes'
import PrCelebration from '../components/PrCelebration'
import { buildRecords, checkPr } from '../utils/records'
import type { PrInfo } from '../utils/records'
import { useNow } from '../hooks/useNow'
import { isIos } from '../utils/platform'
import { buildLastTime, formatLastTime } from '../utils/lastTime'
import { alertRestEnd, unlockAudio } from '../utils/feedback'
import {
  buildBaselines,
  formatRpe,
  roundWeight,
  rpeForSets,
  suggestReps,
  suggestWeight,
} from '../utils/rpe'
import ExercisePicker from '../components/ExercisePicker'
import NumberField from '../components/NumberField'
import TimedSetButton from '../components/TimedSetButton'
import {
  cancelRestNotification,
  clearDeliveredRest,
  scheduleRestNotification,
  setupIfGranted,
} from '../utils/restNotification'
import { allowScreenSleep, keepScreenOn } from '../utils/screen'
import ExerciseHowTo from '../components/ExerciseHowTo'
import { LIVE_IDS, hideAllLiveTimers, hideLiveTimer, showLiveTimer } from '../utils/liveTimer'




const RPE_OPTIONS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// "há 1 min 20 s" (usado quando você volta ao app depois do fim do descanso)
function formatAgo(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return m > 0 ? `${m} min ${s} s` : `${s} s`
}

// Passou desse tempo sem você voltar ao app: só mostra o aviso na tela, sem apitar de repente
const LATE_SOUND_LIMIT_MS = 10 * 60 * 1000

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export default function ActiveSessionPage() {
  const navigate = useNavigate()
  const sessions = useLiveQuery(() => db.sessions.where('status').equals('active').toArray())
  const finished = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray())
  const session = sessions?.[0]
  const [picking, setPicking] = useState(false)
  const [pr, setPr] = useState<PrInfo | null>(null)
  const sessionBest = useRef(new Map<string, { maxWeight: number; best1RM: number }>())
  const now = useNow(Boolean(session))
  const alertedFor = useRef<number | null>(null)
  const baselines = useMemo(() => buildBaselines(finished ?? []), [finished])
  const records = useMemo(() => buildRecords(finished ?? []), [finished])
  const lastTime = useMemo(() => buildLastTime(finished ?? []), [finished])
  const sessionId = session?.id
  const restEndsAt = session?.restEndsAt ?? null
  const remaining = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0
  // Descanso que já acabou e continua na tela (você estava fora do app). Menos de 3 s é só o "tic" normal.
  const overdueSeconds = restEndsAt && now - restEndsAt >= 3000 ? Math.floor((now - restEndsAt) / 1000) : 0
  const showIosNote = isIos()

  // Quando o descanso termina: vibra, apita e limpa o timer
  useEffect(() => {
    if (!sessionId || !restEndsAt) return
    if (now < restEndsAt) return
    if (alertedFor.current === restEndsAt) return
    alertedFor.current = restEndsAt
    const late = now - restEndsAt
    if (late < 3000) {
      // chegou na hora: vibra, apita e limpa o timer
      alertRestEnd()
      mutateSession(sessionId, (s) => {
        s.restEndsAt = null
      })
      return
    }
    // Você voltou ao app depois do fim (o iPhone pausa o app em segundo plano):
    // apita (se não faz muito tempo) e deixa o aviso "Descanso terminou há ..." na tela até você tocar em Ok.
    if (late < LATE_SOUND_LIMIT_MS) alertRestEnd()
  }, [now, restEndsAt, sessionId])

  // Mantém a tela ligada durante o treino e prepara as notificações (se já permitidas)
  const hasSession = Boolean(sessionId)
  useEffect(() => {
    if (!hasSession) return
    void keepScreenOn()
    void setupIfGranted()
    return () => {
      void allowScreenSleep()
    }
  }, [hasSession])

    // Agenda o aviso do fim do descanso (toca mesmo com a tela apagada)
  // e mostra a contagem regressiva na tela de bloqueio
  useEffect(() => {
    if (restEndsAt) void scheduleRestNotification(restEndsAt)
    else if (document.visibilityState === 'visible') void cancelRestNotification()

    if (restEndsAt) {
      void showLiveTimer({
        id: LIVE_IDS.rest,
        title: 'Descanso',
        text: 'Hora da próxima série quando zerar',
        when: restEndsAt,
        countDown: true,
      })
    } else {
      void hideLiveTimer(LIVE_IDS.rest)
    }
  }, [restEndsAt])

    // Cronômetro do treino inteiro (conta para cima) na tela de bloqueio
  const startedAt = session?.startedAt
  const sessionName = session?.name
  useEffect(() => {
    if (!sessionId || startedAt === undefined) return
    void showLiveTimer({
      id: LIVE_IDS.workout,
      title: sessionName ?? 'Treino',
      text: 'Treino em andamento',
      when: startedAt,
      countDown: false,
    })
  }, [sessionId, startedAt, sessionName])

  // Cronômetro de uma série por tempo (prancha etc.)
  const timedEndsAt = session?.exercises
    .flatMap((ex) => ex.sets)
    .find((st) => st.timerEndsAt && !st.done)?.timerEndsAt
  useEffect(() => {
    if (timedEndsAt) {
      void showLiveTimer({
        id: LIVE_IDS.timed,
        title: 'Série por tempo',
        text: 'Segure até zerar',
        when: timedEndsAt,
        countDown: true,
      })
    } else {
      void hideLiveTimer(LIVE_IDS.timed)
    }
  }, [timedEndsAt])

  // Sem treino em andamento: limpa qualquer cronômetro que tenha sobrado
  const noSession = sessions !== undefined && !session
  useEffect(() => {
    if (noSession) hideAllLiveTimers()
  }, [noSession])
  // Ao voltar para o app, limpa da bandeja os avisos que já apareceram
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') void clearDeliveredRest()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  if (!sessions) return <div className="p-4 text-slate-400">Carregando...</div>

  if (!session) {
    return (
      <div className="p-4">
        <h1 className="mb-2 text-3xl font-bold text-emerald-400">Sem treino em andamento</h1>
        <p className="mb-4 text-slate-400">Inicie um treino na aba Treinos.</p>
        <button
          onClick={() => navigate('/')}
          className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white"
        >
          Ir para Treinos
        </button>
      </div>
    )
  }

  const id = session.id

  // Nota do último treino igual a este, para lembrar do que você escreveu
  const lastNote = (finished ?? [])
    .filter((s) => s.workoutId && s.workoutId === session.workoutId && s.notes)
    .sort((a, b) => b.startedAt - a.startedAt)[0]?.notes

  // RPE automático de cada série, considerando o cansaço acumulado dentro do exercício
  const autoRpes = session.exercises.map((ex) => rpeForSets(ex.sets, baselines.get(ex.exerciseId)))

  function setField(ei: number, si: number, patch: Partial<SessionSet>) {
    mutateSession(id, (s) => {
      Object.assign(s.exercises[ei].sets[si], patch)
    })
  }

  // Escolher o RPE de uma série ainda não feita recalcula a carga; de uma série feita, só registra
  function changeRpe(ei: number, si: number, rpe: number | undefined) {
    const ex = session?.exercises[ei]
    const st = ex?.sets[si]
    const base = ex ? baselines.get(ex.exerciseId) : undefined
    if (rpe === undefined || !ex || !st || st.done || ex.mode === 'time' || !base || st.kind === 'warmup') {
      setField(ei, si, { rpeManual: rpe })
      return
    }
    const reps = st.reps > 0 ? st.reps : ex.targetReps
    setField(ei, si, { rpeManual: rpe, reps, weight: roundWeight(suggestWeight(base, reps, rpe)) })
  }

  // Com a carga atual, calcula quantas repetições fazer para chegar no RPE escolhido
  function calcReps(ei: number, si: number) {
    const ex = session?.exercises[ei]
    const st = ex?.sets[si]
    const base = ex ? baselines.get(ex.exerciseId) : undefined
    if (!ex || !st || !base || st.rpeManual === undefined || st.weight <= 0) return
    setField(ei, si, { reps: suggestReps(base, st.weight, st.rpeManual) })
  }

  // Comemora quando a série marcada como feita bate o recorde do exercício
  function checkRecord(ei: number, si: number) {
    const ex = session?.exercises[ei]
    const st = ex?.sets[si]
    if (!ex || !st || st.done || ex.mode === 'time' || ex.cardio) return
    if (st.kind === 'warmup' || st.weight <= 0 || st.reps <= 0) return
    const known = sessionBest.current.get(ex.exerciseId) ?? records.get(ex.exerciseId)
    const res = checkPr(known, st.weight, st.reps)
    sessionBest.current.set(ex.exerciseId, {
      maxWeight: Math.max(known?.maxWeight ?? 0, st.weight),
      best1RM: Math.max(known?.best1RM ?? 0, res.oneRm),
    })
    if (res.isPr) {
      setPr({
        exerciseName: ex.exerciseName,
        weight: st.weight,
        reps: st.reps,
        oneRm: res.oneRm,
        kind: res.weight ? 'weight' : '1rm',
      })
    }
  }

  function toggleDone(ei: number, si: number) {
    unlockAudio()
    checkRecord(ei, si)
    mutateSession(id, (s) => {
      const ex = s.exercises[ei]
      const set = ex.sets[si]
      set.done = !set.done
      if (set.done && ex.restSeconds > 0 && !ex.superset) {
        s.restEndsAt = Date.now() + ex.restSeconds * 1000
      } else if (s.restEndsAt && s.restEndsAt <= Date.now()) {
        s.restEndsAt = null // some o aviso "descanso terminou" antigo
      }
    })
  }

  function completeTimed(ei: number, si: number, secondsDone: number) {
    mutateSession(id, (s) => {
      const ex = s.exercises[ei]
      const set = ex.sets[si]
      set.seconds = secondsDone
      set.timerEndsAt = undefined
      set.done = true
      if (ex.restSeconds > 0 && !ex.superset) s.restEndsAt = Date.now() + ex.restSeconds * 1000
      else if (s.restEndsAt && s.restEndsAt <= Date.now()) s.restEndsAt = null
    })
  }

  function addSet(ei: number) {
    mutateSession(id, (s) => {
      const sets = s.exercises[ei].sets
      const last = sets[sets.length - 1]
      sets.push({
        weight: last?.weight ?? 0,
        reps: last?.reps ?? s.exercises[ei].targetReps,
        seconds: last?.seconds,
        done: false,
      })
    })
  }

  function removeSet(ei: number) {
    if ((session?.exercises[ei]?.sets.length ?? 0) <= 1) return
    if (!window.confirm('Remover a última série deste exercício?')) return
    mutateSession(id, (s) => {
      if (s.exercises[ei].sets.length > 1) s.exercises[ei].sets.pop()
    })
  }

  function adjustExerciseRest(ei: number, deltaSeconds: number) {
    mutateSession(id, (s) => {
      const ex = s.exercises[ei]
      ex.restSeconds = Math.min(600, Math.max(0, ex.restSeconds + deltaSeconds))
    })
  }

  function removeExercise(ei: number) {
    if (!window.confirm('Remover este exercício do treino de hoje?')) return
    mutateSession(id, (s) => {
      s.exercises.splice(ei, 1)
    })
  }

  async function addExercise(e: Exercise) {
    setPicking(false)
    // o mesmo exercício não entra duas vezes no mesmo treino
    if (session?.exercises.some((x) => x.exerciseId === e.id)) return
    const item = await buildSessionExercise(e, 3, 10, 60)
    await mutateSession(id, (s) => {
      if (s.exercises.some((x) => x.exerciseId === e.id)) return
      s.exercises.push(item)
    })
  }

  function adjustRest(deltaSeconds: number) {
    mutateSession(id, (s) => {
      if (!s.restEndsAt) return
      const next = s.restEndsAt + deltaSeconds * 1000
      s.restEndsAt = next <= Date.now() ? null : next
    })
  }

  function skipRest() {
    mutateSession(id, (s) => {
      s.restEndsAt = null
    })
  }

   async function handleFinish() {
    if (!window.confirm('Finalizar o treino? Séries sem ✓ não serão salvas.')) return
    const saved = await finishSession(id)
    if (!saved) window.alert('Nenhuma série foi concluída, então nada foi salvo.')
    hideAllLiveTimers()
    navigate(saved ? '/historico' : '/')
  }

   async function handleDiscard() {
    if (!window.confirm('Descartar este treino? Nada será salvo.')) return
    await db.sessions.delete(id)
    hideAllLiveTimers()
    navigate('/')
  }

  return (
    <div className="p-4">
      <NotificationPrompt />
      {pr && <PrCelebration info={pr} onClose={() => setPr(null)} />}
      <h1 className="text-3xl font-bold text-emerald-400">{session.name}</h1>
      <p className="mb-5 mt-1 text-base tabular-nums text-slate-400">
        Em andamento · {formatElapsed(now - session.startedAt)}
      </p>

      {session.exercises.length === 0 && (
        <p className="mb-4 py-6 text-center text-slate-400">
          Nenhum exercício ainda. Toque em "+ Adicionar exercício".
        </p>
      )}

      {session.exercises.map((ex, ei) => (
        <section key={ei} className="mb-4 rounded-2xl bg-slate-800 p-4">
          <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-700 pb-3">
            <div>
              <div className="text-lg font-semibold text-slate-50">{ex.exerciseName}</div>
              <div className="mt-1">
                <ExerciseHowTo name={ex.exerciseName} />
              </div>
              {(ex.superset || (ei > 0 && session.exercises[ei - 1].superset)) && (
                <div className="mt-1 text-xs font-bold text-emerald-400">
                  SUPERSET · sem descanso entre os dois
                </div>
              )}
              <div className="mt-1 text-sm text-slate-400">
                Meta: {ex.mode === 'time' ? `${ex.targetSeconds ?? 30} s` : `${ex.targetReps} reps`}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <span>Descanso {ex.restSeconds}s</span>
                <button
                  onClick={() => adjustExerciseRest(ei, -15)}
                  className="rounded-md bg-slate-700 px-2 py-1 font-bold text-slate-50"
                  aria-label="Diminuir descanso"
                >
                  −
                </button>
                <button
                  onClick={() => adjustExerciseRest(ei, 15)}
                  className="rounded-md bg-slate-700 px-2 py-1 font-bold text-slate-50"
                  aria-label="Aumentar descanso"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={() => removeExercise(ei)}
              className="rounded-lg bg-slate-700 px-3 py-2 text-red-400"
              aria-label="Remover exercício"
            >
              ✕
            </button>
          </div>
          {ex.progress && (
            <div
              className={`mb-3 rounded-lg p-3 text-sm ${
                ex.progress.action === 'up'
                  ? 'bg-emerald-900/40 text-emerald-300'
                  : ex.progress.action === 'down'
                    ? 'bg-red-900/30 text-red-300'
                    : 'bg-slate-900 text-slate-300'
              }`}
            >
              {ex.progress.action === 'up' ? '▲ ' : ex.progress.action === 'down' ? '▼ ' : '= '}
              {ex.progress.reason}
            </div>
          )}
          {lastTime.get(ex.exerciseId) && (
            <p className="mb-2 text-sm text-slate-400">
              Última vez: {formatLastTime(lastTime.get(ex.exerciseId)!)}
            </p>
          )}
          <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_3.5rem] gap-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span>#</span>
            <span>Peso (kg)</span>
            <span>{ex.mode === 'time' ? 'Tempo (s)' : 'Reps'}</span>
            <span>OK</span>
          </div>

          {ex.sets.map((st, si) => {
            const auto = autoRpes[ei][si]
            const base = baselines.get(ex.exerciseId)
            return (
              <div
                key={si}
                className={`mb-2 rounded-xl p-1 ${st.done ? 'bg-emerald-500/15' : ''}`}
              >
                <div className="grid grid-cols-[2rem_1fr_1fr_3.5rem] items-center gap-2">
                  <span className="text-center font-semibold text-slate-300">{si + 1}</span>
                  <NumberField
                    decimal
                    value={st.weight}
                    onChange={(v) => setField(ei, si, { weight: v })}
                  />
                  {ex.mode === 'time' ? (
                    <NumberField
                      value={st.seconds ?? 0}
                      onChange={(v) => setField(ei, si, { seconds: v })}
                    />
                  ) : (
                    <NumberField value={st.reps} onChange={(v) => setField(ei, si, { reps: v })} />
                  )}
                  <button
                    onClick={() => toggleDone(ei, si)}
                    className={`h-12 w-full rounded-xl text-2xl font-bold ${
                      st.done ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                    aria-label="Concluir série"
                  >
                    ✓
                  </button>
                </div>
                {ex.mode === 'time' && !st.done && (
                  <TimedSetButton
                    seconds={st.seconds ?? ex.targetSeconds ?? 30}
                    endsAt={st.timerEndsAt}
                    onStart={(t) => setField(ei, si, { timerEndsAt: t })}
                    onFinish={(secs) => completeTimed(ei, si, secs)}
                  />
                )}
                <div className="mt-1 flex flex-wrap items-center justify-end gap-2 pr-1 text-xs text-slate-400">
                  {ex.cardio ? (
                    <CardioSelect
                      value={st.cardio}
                      onChange={(cardio) => setField(ei, si, { cardio })}
                    />
                  ) : (
                    <>
                      <SetKindSelect value={st.kind} onChange={(kind) => setField(ei, si, { kind })} />
                      <span>RPE</span>
                      <PickerSelect<number>
                        title="RPE (esforço da série)"
                        value={st.rpeManual ?? ''}
                        options={[
                          {
                            value: '',
                            label: auto !== null ? `Auto (${formatRpe(auto)})` : 'Auto (sem base)',
                          },
                          ...RPE_OPTIONS.map((n) => ({ value: n, label: formatRpe(n) })),
                        ]}
                        onChange={(v) => changeRpe(ei, si, v === '' ? undefined : v)}
                      />
                      {!st.done && base && st.rpeManual !== undefined && st.weight > 0 && (
                        <button
                          onClick={() => calcReps(ei, si)}
                          className="rounded-lg bg-slate-700 px-2 py-1.5 text-sm font-semibold text-emerald-400"
                        >
                          Calcular reps
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => addSet(ei)}
              className="rounded-xl bg-slate-700 py-3 text-sm font-semibold text-slate-50"
            >
              + Série
            </button>
            <button
              onClick={() => removeSet(ei)}
              className="rounded-xl bg-slate-700 py-3 text-sm font-semibold text-slate-50"
            >
              − Série
            </button>
          </div>
        </section>
      ))}

      <button
        onClick={() => setPicking(true)}
        className="w-full rounded-2xl border-2 border-dashed border-slate-600 py-4 text-lg font-semibold text-slate-300 active:opacity-60"
      >
        + Adicionar exercício
      </button>

      <SessionNotes key={id} id={id} initial={session.notes ?? ''} lastNote={lastNote} />

      <button
        onClick={handleFinish}
        className="mt-5 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white active:opacity-80"
      >
        Finalizar treino
      </button>
      <button
        onClick={handleDiscard}
        className="mt-2 w-full rounded-xl py-3 text-base font-semibold text-red-400"
      >
        Descartar treino
      </button>

      {restEndsAt && <div className={showIosNote ? 'h-40' : 'h-24'} />}

      {restEndsAt && (
        <div
          className="fixed inset-x-0 bottom-20 z-40 px-4"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          {showIosNote && (
            <p className="mx-auto mb-2 max-w-md rounded-xl bg-slate-900 p-2 text-xs text-amber-300 shadow-lg">
              ⚠️ No iPhone o app pausa em segundo plano e não consegue avisar. Se você sair do app, o
              aviso aparece assim que voltar.
            </p>
          )}
          {overdueSeconds > 0 ? (
            <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl bg-amber-400 p-3 text-slate-900 shadow-lg">
              <div>
                <div className="text-xs font-bold">DESCANSO TERMINOU</div>
                <div className="text-xl font-bold">há {formatAgo(overdueSeconds)}</div>
              </div>
              <button
                onClick={skipRest}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white"
              >
                Ok
              </button>
            </div>
          ) : (
            <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl bg-emerald-500 p-3 text-white shadow-lg">
              <div>
                <div className="text-xs font-bold">DESCANSO</div>
                <div className="text-3xl font-bold tabular-nums">{formatClock(remaining)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => adjustRest(-15)}
                  className="rounded-lg bg-white/20 px-3 py-3 text-sm font-bold"
                >
                  −15s
                </button>
                <button
                  onClick={() => adjustRest(15)}
                  className="rounded-lg bg-white/20 px-3 py-3 text-sm font-bold"
                >
                  +15s
                </button>
                <button
                  onClick={skipRest}
                  className="rounded-lg bg-white px-3 py-3 text-sm font-bold text-blue-600"
                >
                  Pular
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {picking && (
        <ExercisePicker
          onPick={addExercise}
          onClose={() => setPicking(false)}
          disabledIds={session.exercises.map((x) => x.exerciseId)}
        />
      )}
    </div>
  )
}