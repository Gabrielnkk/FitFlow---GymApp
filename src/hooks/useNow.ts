// made by: Gabriel Mattos
import { useEffect, useState } from 'react'

export function useNow(active = true, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    const timer = setInterval(tick, intervalMs)
    // O iPhone pausa o relógio com o app em segundo plano. Ao voltar, atualiza na hora
    // (sem esperar o próximo "tic"), para o fim do descanso ser percebido imediatamente.
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', tick)
      window.removeEventListener('focus', tick)
    }
  }, [active, intervalMs])

  return now
}
