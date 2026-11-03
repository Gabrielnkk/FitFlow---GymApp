import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TUTORIAL_EVENT, isTutorialDone, markTutorialDone } from '../utils/tutorial'

/** Como achar o pedaço da tela que o passo explica: um seletor CSS ou uma função. */
type Finder = string | (() => Element | null)

interface Step {
  title: string
  text: string
  route?: string
  targets?: Finder[]
}

// ----- ajudantes para achar elementos sem depender de código das outras telas -----
function tab(route: string): Finder {
  return () => document.querySelector(`nav a[href="#${route}"]`)?.closest('li') ?? null
}

/** Primeiro elemento (dos tipos dados) dentro do conteúdo cujo texto bate com o padrão. */
function byText(pattern: RegExp, tags = 'button, a, section, li'): Finder {
  return () => {
    const all = Array.from(document.querySelectorAll(`main ${tags.split(',').map((t) => t.trim()).join(', main ')}`))
    return all.find((el) => pattern.test(el.textContent ?? '')) ?? null
  }
}

const FIXED_BUTTON = (pattern: RegExp): Finder => () =>
  Array.from(document.querySelectorAll('button')).find((b) => pattern.test(b.textContent ?? '')) ?? null

const STEPS: Step[] = [
  {
    title: 'Bem-vindo ao FitFlow',
    text: 'Este tour mostra o app por partes: a parte iluminada é a que está sendo explicada, e o resto fica desfocado. Você pode pular quando quiser.',
    route: '/',
  },
  {
    title: 'Barra de abas',
    text: 'Aqui embaixo ficam as áreas do app. Toque em uma aba para ir até ela. Vamos passar por todas.',
    route: '/',
    targets: ['nav'],
  },
  {
    title: 'Suas rotinas',
    text: 'Cada rotina tem o botão ▶ Iniciar treino. Use as setas para mudar a ordem e Duplicar para copiar. Escolha os dias da semana de cada treino: o app mostra o próximo treino certo, mesmo se você faltar um dia.',
    route: '/',
    targets: ['main ul > li'],
  },
  {
    title: 'Criar treinos',
    text: 'Toque em + Novo treino para montar uma rotina do zero, ou em ✨ Gerar treino com IA para o app montar uma a partir do seu objetivo (precisa da chave do Gemini nos Ajustes).',
    route: '/',
    targets: [FIXED_BUTTON(/novo treino/i), byText(/gerar treino/i)],
  },
  {
    title: 'Seu personagem',
    text: 'Cada treino e cada dia de dieta dão XP e sobem o nível do seu personagem. Toque nele para ver missões, conquistas, mudar a aparência e entrar na Aventura: dungeons, Torre Infinita e loja.',
    route: '/',
    targets: [byText(/\bXP\b|n[ií]vel|\bnv\b/i, 'button, a, section')],
  },
  {
    title: 'Durante o treino',
    text: 'Ao iniciar, preencha carga e repetições e toque em ✓ para concluir a série: o descanso começa sozinho e o cronômetro aparece até na tela de bloqueio. Escolha o tipo da série (aquecimento, falha, drop) e o RPE, que é o esforço da série.',
    route: '/',
    targets: [byText(/iniciar treino|come[çc]ar agora/i, 'button')],
  },
  {
    title: 'Exercícios',
    text: 'A biblioteca vem com cerca de 100 exercícios. Toque em ▶ Como fazer para ver as fotos e os passos antes de usar. Você também pode criar os seus, inclusive por tempo (prancha) e cardio.',
    route: '/exercicios',
    targets: ['main input', byText(/como fazer/i, 'button')],
  },
  {
    title: 'Dieta',
    text: 'Registre o que você come em cada refeição e veja calorias e macros do dia. Defina sua meta pela calculadora e use a IA para estimar uma refeição por texto ou por foto.',
    route: '/dieta',
    targets: [tab('/dieta')],
  },
  {
    title: 'Histórico',
    text: 'Veja os treinos finalizados, o calendário de frequência, a sequência de semanas e as suas notas.',
    route: '/historico',
    targets: [tab('/historico')],
  },
  {
    title: 'Progresso',
    text: 'Gráficos de carga, volume e recordes por exercício. Na aba Corpo você registra peso e medidas, vê IMC e gordura e monta o treino semanal.',
    route: '/progresso',
    targets: [tab('/progresso')],
  },
  {
    title: 'Assistente',
    text: 'Pergunte sobre os seus treinos, cargas e sequência. Funciona offline; com uma chave do Gemini nos Ajustes ele fica mais esperto.',
    route: '/assistente',
    targets: [tab('/assistente')],
  },
  {
    title: 'Ajustes',
    text: 'Faça backup (ele leva também dieta, personagem e jogo), ligue a progressão automática, escolha o tema e o efeito vidro, configure alertas e abra as calculadoras: 1RM, água, IMC, gordura e anilhas.',
    route: '/ajustes',
    targets: [tab('/ajustes')],
  },
  {
    title: 'Tudo pronto',
    text: 'Bom treino! Para rever este tour, abra Ajustes e toque em "Rever tutorial".',
    route: '/',
  },
]

interface Box {
  x: number
  y: number
  w: number
  h: number
}

const PAD = 6

function resolve(step: Step): Element[] {
  const found: Element[] = []
  for (const f of step.targets ?? []) {
    const el = typeof f === 'string' ? document.querySelector(f) : f()
    if (el) found.push(el)
  }
  return found
}

function boxOf(el: Element): Box | null {
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  const x = Math.max(0, r.left - PAD)
  const y = Math.max(0, r.top - PAD)
  return {
    x,
    y,
    w: Math.min(window.innerWidth, r.right + PAD) - x,
    h: Math.min(window.innerHeight, r.bottom + PAD) - y,
  }
}

function holePath(b: Box): string {
  const r = Math.min(16, b.w / 2, b.h / 2)
  const { x, y, w, h } = b
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  )
}

export default function Tutorial() {
  const navigate = useNavigate()
  const [step, setStep] = useState<number | null>(() => (isTutorialDone() ? null : 0))
  const [boxes, setBoxes] = useState<Box[]>([])
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const scrolledFor = useRef<number | null>(null)

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

  // Acompanha o(s) elemento(s) do passo: a tela pode mudar de tamanho, rolar ou demorar a carregar
  useEffect(() => {
    if (step === null) return
    scrolledFor.current = null
    let raf = 0
    let last = ''
    function frame() {
      const current = STEPS[step as number]
      const els = resolve(current)
      if (els.length > 0 && scrolledFor.current !== step) {
        const r = els[0].getBoundingClientRect()
        const inside = r.top >= 0 && r.bottom <= window.innerHeight
        const fixed = getComputedStyle(els[0]).position === 'fixed'
        if (!inside && !fixed) els[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
        scrolledFor.current = step
      }
      const next = els.map(boxOf).filter((b): b is Box => b !== null)
      const key = JSON.stringify(next.map((b) => [b.x, b.y, b.w, b.h].map(Math.round))) + window.innerWidth + window.innerHeight
      if (key !== last) {
        last = key
        setBoxes(next)
        setSize({ w: window.innerWidth, h: window.innerHeight })
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [step])

  if (step === null) return null

  const current = STEPS[step]
  const last = step === STEPS.length - 1

  function close() {
    markTutorialDone()
    setStep(null)
  }

  // O cartão vai para o lado da tela que não cobre a parte explicada
  const centerY = boxes.length > 0 ? boxes.reduce((s, b) => s + b.y + b.h / 2, 0) / boxes.length : size.h / 2
  const cardOnTop = boxes.length > 0 && centerY > size.h * 0.5
  const clip =
    boxes.length > 0
      ? `path(evenodd, "M0 0H${size.w}V${size.h}H0Z${boxes.map(holePath).join('')}")`
      : undefined

  return (
    <div className="fixed inset-0 z-[60]" style={{ touchAction: 'none' }}>
      <style>{`@keyframes tour-pulse{0%,100%{box-shadow:0 0 0 0 rgba(96,165,250,.55)}50%{box-shadow:0 0 0 7px rgba(96,165,250,0)}}`}</style>

      {/* fundo escuro e desfocado, com "janelas" nas partes explicadas */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(2, 6, 23, 0.74)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
          clipPath: clip,
          WebkitClipPath: clip,
        }}
      />

      {/* contorno brilhante em volta das partes explicadas */}
      {boxes.map((b, i) => (
        <div
          key={i}
          className="pointer-events-none absolute"
          style={{
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            borderRadius: Math.min(16, b.w / 2, b.h / 2),
            border: '2px solid #60a5fa',
            animation: 'tour-pulse 1.8s ease-in-out infinite',
          }}
        />
      ))}

      <div
        className="absolute inset-x-0 px-4"
        style={
          cardOnTop
            ? { top: 'calc(env(safe-area-inset-top) + 12px)' }
            : { bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }
        }
      >
        <div
          key={step}
          className="sheet-enter mx-auto max-w-md rounded-2xl border border-white/15 p-4 shadow-2xl"
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="text-lg font-bold text-[#60a5fa]">{current.title}</div>
            <div className="text-xs text-slate-400">
              {step + 1} de {STEPS.length}
            </div>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-slate-200">{current.text}</p>

          <div className="mb-3 flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: i === step ? 18 : 6,
                  background: i === step ? '#60a5fa' : 'rgba(148,163,184,.4)',
                  transition: 'width .2s',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={close} className="rounded-lg px-3 py-2 text-sm text-slate-400">
              Pular
            </button>
            <div className="flex-1" />
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => (last ? close() : setStep(step + 1))}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
            >
              {last ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}