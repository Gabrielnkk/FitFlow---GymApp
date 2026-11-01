import { useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { useRpg } from '../hooks/useRpg'
import { gearTiers } from '../utils/shop'
import HeroFigure from './HeroFigure'

/** Cartão pequeno do personagem, para a tela Treinos. */
export default function CharacterCard() {
  const navigate = useNavigate()
  const rpg = useRpg()
  const game = useGame()
  if (!rpg) return null
  const c = rpg.character

  return (
    <button
      onClick={() => navigate('/personagem')}
      className="mb-4 flex w-full items-center gap-4 rounded-2xl p-3 text-left active:opacity-80"
      style={{ background: 'linear-gradient(135deg, #1d1a3a, #0e0c1f)' }}
    >
      <div className="shrink-0">
        <HeroFigure rankIndex={c.rankIndex} color={c.rank.color} size={72} gear={gearTiers(game)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-lg font-bold text-white">{rpg.name}</span>
          <span
            className="rounded-md px-2 py-0.5 text-xs font-extrabold text-[#0e0c1f]"
            style={{ background: c.rank.color }}
          >
            RANK {c.rank.letter}
          </span>
        </div>
        <div className="text-sm text-[#b8b6d0]">
          Nível {c.level} · {c.rank.title}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{ width: `${c.pct}%`, background: c.rank.color }}
          />
        </div>
        <div className="mt-1 text-xs text-[#918fa9]">
          {c.intoLevel.toLocaleString('pt-BR')} / {c.needed.toLocaleString('pt-BR')} XP
        </div>
      </div>
      <span className="shrink-0 text-xl text-[#6e6c88]">›</span>
    </button>
  )
}