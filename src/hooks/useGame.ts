import { useEffect, useState } from 'react'
import { RPG_EVENT } from '../utils/rpg'
import { getGame, type GameState } from '../utils/gameState'

/** Lê o jogo guardado e se atualiza quando ele muda. */
export function useGame(): GameState | null {
  const [game, setGame] = useState<GameState | null>(() => getGame())

  useEffect(() => {
    const onChange = () => setGame(getGame())
    window.addEventListener(RPG_EVENT, onChange)
    return () => window.removeEventListener(RPG_EVENT, onChange)
  }, [])

  return game
}