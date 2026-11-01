import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { applyReminder, getReminder } from '../utils/reminder'
import type { ReminderConfig } from '../utils/reminder'

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export default function ReminderSettings() {
  const [cfg, setCfg] = useState<ReminderConfig>(getReminder)
  const [message, setMessage] = useState('')

  async function update(next: ReminderConfig) {
    setCfg(next)
    const ok = await applyReminder(next)
    if (!Capacitor.isNativePlatform()) {
      setMessage('Salvo. Os lembretes só tocam no app instalado no celular.')
    } else if (!ok) {
      setMessage('Não consegui agendar. Permita as notificações do FitFlow nas configurações do celular.')
    } else if (!next.on) {
      setMessage('Lembrete desligado.')
    } else if (next.days.length === 0) {
      setMessage('Escolha pelo menos um dia da semana.')
    } else {
      setMessage(`Pronto! Lembrete às ${pad(next.hour)}:${pad(next.minute)} nos dias marcados.`)
    }
  }

  function toggleDay(d: number) {
    const days = cfg.days.includes(d) ? cfg.days.filter((x) => x !== d) : [...cfg.days, d].sort()
    void update({ ...cfg, days })
  }

  function changeTime(value: string) {
    const [h, m] = value.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return
    void update({ ...cfg, hour: h, minute: m })
  }

  return (
    <section className="mb-4 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-1 text-xl font-bold">Lembrete de treino</h2>
      <p className="mb-3 text-sm text-slate-400">
        Receba uma notificação nos dias e no horário que você escolher, mesmo com o app fechado.
      </p>

      <button
        onClick={() => void update({ ...cfg, on: !cfg.on })}
        className={`mb-3 w-full rounded-xl py-3 text-base font-bold ${
          cfg.on ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
        }`}
      >
        {cfg.on ? '✓ Lembrete ligado' : 'Lembrete desligado'}
      </button>

      {cfg.on && (
        <>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm text-slate-400">Horário</span>
            <input
              type="time"
              value={`${pad(cfg.hour)}:${pad(cfg.minute)}`}
              onChange={(e) => changeTime(e.target.value)}
              className="w-full rounded-xl bg-slate-700 px-4 py-3 text-lg"
            />
          </label>

          <span className="mb-1 block text-sm text-slate-400">Dias da semana</span>
          <div className="grid grid-cols-7 gap-1">
            {DAY_LABELS.map((label, d) => (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                aria-label={DAY_NAMES[d]}
                className={`rounded-lg py-3 text-sm font-bold ${
                  cfg.days.includes(d) ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {message && <p className="mt-3 text-center text-sm text-slate-300">{message}</p>}
    </section>
  )
}