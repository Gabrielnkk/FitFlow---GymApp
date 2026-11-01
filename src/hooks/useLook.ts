import { useEffect, useState } from 'react'
import { RPG_EVENT } from '../utils/rpg'
import { getLook, type Look } from '../utils/look'

/** Aparência escolhida do personagem; se atualiza quando ela muda. */
export function useLook(): Look {
  const [look, setLook] = useState<Look>(() => getLook())

  useEffect(() => {
    const onChange = () => setLook(getLook())
    window.addEventListener(RPG_EVENT, onChange)
    return () => window.removeEventListener(RPG_EVENT, onChange)
  }, [])

  return look
}