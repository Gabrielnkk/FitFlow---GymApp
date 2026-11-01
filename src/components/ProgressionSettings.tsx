import { useState } from 'react'
import { isAutoProgressionOn, setAutoProgression } from '../db/progression'

export default function ProgressionSettings() {
  const [on, setOn] = useState(isAutoProgressionOn)

  function toggle() {
    const next = !on
    setOn(next)
    setAutoProgression(next)
  }

  return (
    <section className="mb-4 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-1 text-xl font-bold">Progressão automática</h2>
      <p className="mb-3 text-sm text-slate-400">
        Ao iniciar um treino, o app sugere a carga pela última vez. Bateu a meta de reps em todas as
        séries com RPE médio abaixo de 9,5: sobe (1 kg até 20 kg, 2,5 kg até 100 kg, 5 kg acima).
        Não bateu: repete. Duas sessões seguidas sem bater: reduz cerca de 5%. Em exercícios de
        tempo, sobe 5 s (30 s no cardio).
      </p>
      <button
        onClick={toggle}
        className={`w-full rounded-xl py-3 text-base font-bold ${
          on ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'
        }`}
      >
        {on ? '✓ Ligada' : 'Desligada'}
      </button>
    </section>
  )
}