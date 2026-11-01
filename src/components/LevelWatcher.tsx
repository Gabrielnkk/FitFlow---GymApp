import { useEffect, useState } from 'react'
import { useRpg } from '../hooks/useRpg'
import { RANKS, getSeenLevel, setSeenLevel, type Rank } from '../utils/rpg'

const COLORS = ['#60a5fa', '#22d3ee', '#fbbf24', '#f472b6', '#a78bfa', '#34d399']
const PIECES = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 90) / 100,
  duration: 2.2 + ((i * 29) % 16) / 10,
  size: 6 + ((i * 11) % 8),
  color: COLORS[i % COLORS.length],
  drift: ((i * 17) % 80) - 40,
}))

interface Up {
  level: number
  rank: Rank
  newRank: boolean
}

/** Fica escutando o nível do personagem e comemora quando ele sobe. */
export default function LevelWatcher() {
  const rpg = useRpg()
  const [up, setUp] = useState<Up | null>(null)
  const level = rpg?.character.level
  const rank = rpg?.character.rank

  useEffect(() => {
    if (level === undefined || !rank) return
    const seen = getSeenLevel()
    if (seen === null || level < seen) {
      setSeenLevel(level) // primeira vez (ou nível diminuiu): só anota, sem festa
      return
    }
    if (level > seen) {
      setSeenLevel(level)
      setUp({ level, rank, newRank: RANKS.some((r) => r.min > seen && r.min <= level) })
    }
  }, [level, rank])

  useEffect(() => {
    if (!up) return
    try {
      navigator.vibrate?.([100, 50, 100, 50, 200])
    } catch {
      /* sem vibração, tudo bem */
    }
    const t = window.setTimeout(() => setUp(null), 5000)
    return () => window.clearTimeout(t)
  }, [up])

  if (!up) return null

  return (
    <div
      onClick={() => setUp(null)}
      className="pr-overlay fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden p-6 text-center"
      style={{ color: '#ffffff', backgroundColor: '#05091c' }}
    >
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="pr-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            borderRadius: '2px',
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
      <div className="pr-glow" />
      <div className="pr-trophy">⚡</div>
      <div className="pr-title mt-4 text-4xl font-extrabold tracking-tight">NÍVEL {up.level}!</div>
      <div className="pr-sub mt-2 text-xl font-semibold" style={{ color: up.rank.color }}>
        {up.newRank ? `Novo rank: ${up.rank.letter} · ${up.rank.title}` : `Rank ${up.rank.letter} · ${up.rank.title}`}
      </div>
      <div className="pr-sub mt-8 text-sm" style={{ color: '#94a3b8' }}>
        Toque para continuar
      </div>
    </div>
  )
}