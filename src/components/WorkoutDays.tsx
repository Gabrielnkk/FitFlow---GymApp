import { useState } from 'react'
import Modal from './Modal'
import { WEEKDAYS, WEEKDAY_ORDER, setDays } from '../utils/schedule'

interface Props {
  id: string
  name: string
  days: number[]
  onChange: () => void
}

export default function WorkoutDays({ id, name, days, onChange }: Props) {
  const [open, setOpen] = useState(false)

  function toggle(day: number) {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    setDays(id, next)
    onChange()
  }

  const label =
    days.length > 0
      ? WEEKDAY_ORDER.filter((d) => days.includes(d))
          .map((d) => WEEKDAYS[d])
          .join(' · ')
      : 'Definir dias da semana'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 text-sm font-medium text-emerald-400 active:opacity-60"
      >
        📅 {label}
      </button>

      {open && (
        <Modal title={`Dias de ${name}`} onClose={() => setOpen(false)}>
          <p className="mb-4 text-sm text-slate-400">
            Escolha em quais dias da semana você faz este treino. O app usa isso para mostrar o
            treino certo do dia, mesmo se você faltar.
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_ORDER.map((d) => {
              const on = days.includes(d)
              return (
                <button
                  key={d}
                  onClick={() => toggle(d)}
                  className={`rounded-xl py-3 text-sm font-semibold ${
                    on ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {WEEKDAYS[d]}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-5 w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-semibold text-white"
          >
            Pronto
          </button>
        </Modal>
      )}
    </>
  )
}