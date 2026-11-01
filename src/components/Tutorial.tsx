import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TUTORIAL_EVENT, isTutorialDone, markTutorialDone } from '../utils/tutorial'

interface Step {
  title: string
  text: string
  route?: string
}

const STEPS: Step[] = [
  {
    title: 'Bem-vindo ao FitFlow',
    text: 'Este tour rápido mostra cada aba do app. Você pode pular quando quiser.',
  },
  {
    title: 'Treinos',
    text: 'Crie rotinas com os seus exercícios e toque em Iniciar para treinar. Use as setas para mudar a ordem e o botão de duplicar para copiar um treino.',
    route: '/',
  },
  {
    title: 'Exercícios',
    text: 'A biblioteca já vem com cerca de 100 exercícios. Você pode criar os seus, inclusive por tempo (prancha) e cardio.',
    route: '/exercicios',
  },
  {
    title: 'Durante o treino',
    text: 'Preencha carga e repetições e toque em ✓ para concluir a série: o descanso começa sozinho. Escolha o tipo da série (aquecimento, falha, drop) e o RPE, que é o esforço da série.',
    route: '/',
  },
  {
    title: 'Histórico',
    text: 'Veja os treinos finalizados, o calendário de frequência, a sequência de semanas e as suas notas.',
    route: '/historico',
  },
  {
    title: 'Progresso',
    text: 'Gráficos de carga e recordes por exercício. Na aba Corpo você registra peso e medidas, vê IMC e gordura e monta o treino semanal.',
    route: '/progresso',
  },
  {
    title: 'Assistente',
    text: 'Pergunte sobre os seus treinos, cargas e sequência. Funciona offline; com uma chave do Gemini nos Ajustes ele fica mais esperto.',
    route: '/assistente',
  },
  {
    title: 'Ajustes e ferramentas',
    text: 'Faça backup, ligue a progressão automática, desligue o apito do descanso e abra as calculadoras (1RM, água, IMC, gordura) e a calculadora de anilhas.',
    route: '/ajustes',
  },
  {
    title: 'Tudo pronto',
    text: 'Bom treino! Para rever este tour, abra Ajustes e toque em "Rever tutorial".',
    route: '/',
  },
]

export default function Tutorial() {
  const navigate = useNavigate()
  const [step, setStep] = useState<number | null>(() => (isTutorialDone() ? null : 0))

  // Botão "Rever tutorial" dos Ajustes
  useEffect(() => {
    function open() {
      setStep(0)
    }
    window.addEventListener(TUTORIAL_EVENT, open)
    return () => window.removeEventListener(TUTORIAL_EVENT, open)
  }, [])

  const route = step !== null ? STEPS[step].route : undefined

  // Leva você para a aba do passo
  useEffect(() => {
    if (route) navigate(route)
  }, [route, step, navigate])

  // Faz o ícone da aba pulsar
  useEffect(() => {
    if (!route) return
    const el = document.querySelector(`nav a[href="#${route}"]`)
    el?.classList.add('tutorial-highlight')
    return () => el?.classList.remove('tutorial-highlight')
  }, [route])

  if (step === null) return null

  const current = STEPS[step]
  const last = step === STEPS.length - 1

  function close() {
    markTutorialDone()
    setStep(null)
  }

  return (
    <div
      className="fixed inset-x-0 bottom-20 z-[60] px-4"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="sheet-enter mx-auto max-w-md rounded-2xl border border-emerald-500 bg-slate-800 p-4 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-lg font-bold text-emerald-400">{current.title}</div>
          <div className="text-xs text-slate-400">
            {step + 1} de {STEPS.length}
          </div>
        </div>
        <p className="mb-3 text-sm text-slate-200">{current.text}</p>
        <div className="flex items-center gap-2">
          <button onClick={close} className="rounded-lg px-3 py-2 text-sm text-slate-400">
            Pular
          </button>
          <div className="flex-1" />
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold"
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => (last ? close() : setStep(step + 1))}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-900"
          >
            {last ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}