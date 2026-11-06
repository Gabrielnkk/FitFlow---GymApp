// made by: Gabriel Mattos
import { useEffect, useState } from 'react'

// Aparece só uma vez por abertura do app (não volta ao navegar entre telas)
let alreadyShown = false

const SHOW_MS = 1900
const FADE_MS = 450

export default function Splash() {
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>(alreadyShown ? 'gone' : 'show')

  useEffect(() => {
    if (alreadyShown) return
    const t1 = window.setTimeout(() => setPhase('fade'), SHOW_MS)
    const t2 = window.setTimeout(() => {
      // só marca "já mostrei" quando termina: o StrictMode do React (npm run dev) roda este efeito
      // duas vezes, e marcar no começo fazia o splash ficar travado na tela
      alreadyShown = true
      setPhase('gone')
    }, SHOW_MS + FADE_MS)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(circle at 50% 40%, #1e3a8a 0%, #0b1226 60%, #050816 100%)',
        opacity: phase === 'fade' ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: phase === 'fade' ? 'none' : 'auto',
      }}
    >
      <style>{`
        @keyframes sp-ring{0%{transform:scale(.55);opacity:0}30%{opacity:.7}100%{transform:scale(1.9);opacity:0}}
        @keyframes sp-pop{0%{transform:scale(.6) rotate(-14deg);opacity:0}60%{transform:scale(1.08) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes sp-draw{from{stroke-dashoffset:160}to{stroke-dashoffset:0}}
        @keyframes sp-lift{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes sp-letter{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sp-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @media (prefers-reduced-motion: reduce){.sp-anim,.sp-anim *{animation-duration:.01ms!important;animation-delay:0s!important}}
      `}</style>

      <div className="sp-anim relative flex h-44 w-44 items-center justify-center">
        {/* ondas de brilho */}
        {[0, 0.5].map((d) => (
          <span
            key={d}
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid rgba(96,165,250,.55)',
              animation: `sp-ring 1.7s ease-out ${d}s infinite`,
            }}
          />
        ))}
        {/* halter */}
        <div style={{ animation: 'sp-pop .7s cubic-bezier(.2,.9,.3,1.2) both' }}>
          <svg
            viewBox="0 0 120 60"
            width="132"
            height="66"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 14px rgba(96,165,250,.8))',
              animation: 'sp-lift 1.2s ease-in-out .8s infinite',
            }}
          >
            {['M10 18V42', 'M22 12V48', 'M98 12V48', 'M110 18V42', 'M22 30H98'].map((d) => (
              <path
                key={d}
                d={d}
                strokeDasharray="160"
                style={{ animation: 'sp-draw .9s ease-out .15s both' }}
              />
            ))}
          </svg>
        </div>
      </div>

      <div className="sp-anim mt-2 flex text-4xl font-extrabold tracking-wide text-white">
        {'FitFlow'.split('').map((ch, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              animation: `sp-letter .5s ease-out ${0.55 + i * 0.07}s both`,
              color: i >= 3 ? '#60a5fa' : '#fff',
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      <div
        className="sp-anim mt-4 h-1 w-28 origin-left rounded-full"
        style={{
          background: 'linear-gradient(90deg,#2563eb,#22d3ee)',
          animation: `sp-bar ${SHOW_MS - 600}ms ease-in-out .5s both`,
        }}
      />
    </div>
  )
}