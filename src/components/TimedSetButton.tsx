import { useEffect, useRef } from 'react'
import { useNow } from '../hooks/useNow'
import { alertRestEnd, unlockAudio } from '../utils/feedback'

interface Props {
  seconds: number
  endsAt: number | null | undefined
  onStart: (endsAt: number) => void
  onFinish: (secondsDone: number) => void
}

function clock(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TimedSetButton({ seconds, endsAt, onStart, onFinish }: Props) {
  const running = typeof endsAt === 'number'
  const now = useNow(running)
  const finished = useRef(false)

  const remaining = typeof endsAt === 'number' ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : seconds

  // O fim do cronômetro fica salvo no banco: se o app fechar, ele continua de onde estava
  useEffect(() => {
    if (typeof endsAt !== 'number' || finished.current) return
    if (now >= endsAt) {
      finished.current = true
      // Se o app ficou fechado além do fim, não apita atrasado
      if (now - endsAt < 3000) alertRestEnd()
      onFinish(seconds)
    }
  }, [now, endsAt, seconds, onFinish])

  function start() {
    unlockAudio()
    finished.current = false
    onStart(Date.now() + seconds * 1000)
  }

  function stop() {
    finished.current = true
    onFinish(Math.max(1, seconds - remaining))
  }

  if (!running) {
    return (
      <button
        onClick={start}
        className="mt-2 w-full rounded-lg bg-slate-700 py-3 text-base font-semibold active:bg-slate-600"
      >
        ▶ Iniciar cronômetro ({clock(seconds)})
      </button>
    )
  }

  return (
    <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500 p-3 text-slate-900">
      <span className="text-3xl font-bold tabular-nums">{clock(remaining)}</span>
      <button onClick={stop} className="rounded-lg bg-slate-900 px-4 py-3 font-bold text-emerald-400">
        Parar e salvar
      </button>
    </div>
  )
}