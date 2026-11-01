import { useEffect } from 'react'
import type { PrInfo } from '../utils/records'

const COLORS = ['#60a5fa', '#22d3ee', '#fbbf24', '#f472b6', '#a78bfa', '#34d399']

// Posições fixas para o confete não "pular" quando a tela re-renderiza
const PIECES = Array.from({ length: 44 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 90) / 100,
  duration: 2.2 + ((i * 29) % 16) / 10,
  size: 6 + ((i * 11) % 8),
  color: COLORS[i % COLORS.length],
  drift: ((i * 17) % 80) - 40,
  round: i % 3 === 0,
}))

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export default function PrCelebration({ info, onClose }: { info: PrInfo; onClose: () => void }) {
  useEffect(() => {
    try {
      navigator.vibrate?.([120, 60, 120, 60, 240])
    } catch {
      /* sem vibração, tudo bem */
    }
    const t = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(t)
  }, [onClose])

  return (
    <div
      onClick={onClose}
            className="pr-overlay fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden p-6 text-center text-white"
      style={{ color: '#ffffff', backgroundColor: '#05091c' }}>
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="pr-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? '9999px' : '2px',
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}

      <div className="pr-glow" />
      <div className="pr-trophy">🏆</div>
      <div className="pr-title mt-4 text-4xl font-extrabold tracking-tight">NOVO RECORDE!</div>
      <div className="pr-sub mt-2 text-xl font-semibold text-[#e2e8f0]">{info.exerciseName}</div>
      <div className="pr-sub mt-5 rounded-2xl border border-white/15 bg-white/10 px-6 py-4">
                <div className="text-3xl font-extrabold text-white">
          {fmt(info.weight)} kg × {info.reps}
        </div>
        <div className="mt-1 text-sm text-[#cbd5e1]">
          1RM estimado: {fmt(Math.round(info.oneRm * 10) / 10)} kg
          {info.kind === 'weight' ? ' · maior carga já usada' : ''}
        </div>
      </div>
           <div className="pr-sub mt-8 text-sm text-[#94a3b8]">Toque para continuar</div>
      </div>
  )
}