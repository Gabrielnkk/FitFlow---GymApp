import { useState } from 'react'
import { dateToInput } from '../db/body'
import type { Session } from '../types'
import {
  bestStreak,
  daysTrainedInWeek,
  getWeeklyGoal,
  mondayOf,
  setWeeklyGoal,
  trainedDays,
  weeklyStreak,
} from '../utils/frequency'

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export default function FrequencyCalendar({ sessions }: { sessions: Session[] }) {
  const today = new Date()
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [goal, setGoal] = useState(getWeeklyGoal)

  const days = trainedDays(sessions)
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // segunda = 0
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const todayKey = dateToInput(today.getTime())

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const trainedInMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) =>
    days.has(dateToInput(new Date(year, month, d).getTime())),
  ).length

  const thisWeek = daysTrainedInWeek(days, mondayOf(today))
  const streak = weeklyStreak(days, goal, today)
  const best = bestStreak(days, goal, today)

  function changeGoal(delta: number) {
    const next = Math.min(7, Math.max(1, goal + delta))
    setGoal(next)
    setWeeklyGoal(next)
  }

  function changeMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1))
  }

  return (
    <section className="mb-5 rounded-xl bg-slate-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="rounded-lg bg-slate-700 px-4 py-2 text-lg"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <div className="text-lg font-bold capitalize">
          {cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={() => changeMonth(1)}
          disabled={isCurrentMonth}
          className="rounded-lg bg-slate-700 px-4 py-2 text-lg disabled:opacity-30"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const key = dateToInput(new Date(year, month, day).getTime())
          const trained = days.has(key)
          const isToday = key === todayKey
          return (
            <div key={key} className="flex items-center justify-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                  trained ? 'bg-emerald-500 font-bold' : 'text-slate-300'
                } ${isToday ? 'ring-2 ring-emerald-400' : ''}`}
              >
                {day}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="text-2xl font-bold text-emerald-400">🔥 {streak}</div>
          <div className="text-xs text-slate-400">
            {streak === 1 ? 'semana seguida' : 'semanas seguidas'}
          </div>
        </div>
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="text-2xl font-bold text-emerald-400">{best}</div>
          <div className="text-xs text-slate-400">melhor sequência</div>
        </div>
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="text-2xl font-bold text-emerald-400">{trainedInMonth}</div>
          <div className="text-xs text-slate-400">{trainedInMonth === 1 ? 'dia no mês' : 'dias no mês'}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-slate-300">
            Esta semana: {thisWeek} de {goal}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-slate-400">Meta: {plural(goal, 'dia', 'dias')}</span>
            <button
              onClick={() => changeGoal(-1)}
              className="rounded-lg bg-slate-700 px-3 py-1 text-base font-bold"
              aria-label="Diminuir meta"
            >
              −
            </button>
            <button
              onClick={() => changeGoal(1)}
              className="rounded-lg bg-slate-700 px-3 py-1 text-base font-bold"
              aria-label="Aumentar meta"
            >
              +
            </button>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-900">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${Math.min(100, (thisWeek / goal) * 100)}%` }}
          />
        </div>
      </div>
    </section>
  )
}