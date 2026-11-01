import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { scheduleRestNotification, setupNotifications } from '../utils/restNotification'
import { isRestSoundOn, setRestSoundOn } from '../utils/restSound'
import { isKeepAwakeOn, setKeepAwakeOn } from '../utils/screen'

export default function RestAlertSettings() {
  const [keepOn, setKeepOn] = useState(isKeepAwakeOn)
  const [soundOn, setSoundOn] = useState(isRestSoundOn)
  const [message, setMessage] = useState('')

  function toggleKeep() {
    const next = !keepOn
    setKeepOn(next)
    setKeepAwakeOn(next)
    setMessage('Vale a partir do próximo treino que você iniciar.')
  }

  function toggleSound() {
    const next = !soundOn
    setSoundOn(next)
    setRestSoundOn(next)
    setMessage(
      next
        ? 'Apito ligado.'
        : 'Apito desligado: o fim do descanso só vibra (em alguns celulares a notificação fica silenciosa).',
    )
  }

  async function testNotification() {
    if (!Capacitor.isNativePlatform()) {
      setMessage('O teste só funciona no app instalado no celular.')
      return
    }
    await setupNotifications()
    const ok = await scheduleRestNotification(Date.now() + 10000)
    setMessage(
      ok
        ? 'Aviso agendado para daqui a 10 segundos. Bloqueie a tela do celular e aguarde.'
        : 'Não consegui agendar. Verifique se as notificações do FitFlow estão permitidas nas configurações do celular.',
    )
  }

  return (
    <section className="mb-4 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-1 text-xl font-bold">Alerta de descanso</h2>
      <p className="mb-3 text-sm text-slate-400">
        Com o descanso rodando, o app agenda uma notificação com som e vibração, que toca mesmo
        com a tela apagada. Se o aviso atrasar, no celular deixe o FitFlow sem restrição de bateria.
      </p>

      <button
        onClick={toggleSound}
        className={`mb-2 w-full rounded-xl py-3 text-base font-bold ${
          soundOn ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'
        }`}
      >
        {soundOn ? '✓ Apito do fim do descanso ligado' : 'Apito do fim do descanso desligado'}
      </button>

      <button
        onClick={toggleKeep}
        className={`mb-2 w-full rounded-xl py-3 text-base font-bold ${
          keepOn ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'
        }`}
      >
        {keepOn ? '✓ Tela sempre ligada durante o treino' : 'Tela pode apagar durante o treino'}
      </button>

      <button
        onClick={testNotification}
        className="w-full rounded-xl bg-slate-700 py-3 text-base font-bold active:bg-slate-600"
      >
        Testar aviso (10 segundos)
      </button>

      {message && <p className="mt-3 text-center text-sm text-slate-300">{message}</p>}
    </section>
  )
}