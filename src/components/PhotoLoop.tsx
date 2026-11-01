import { useEffect, useState } from 'react'
import type { ExercisePhotos } from '../data/exercisePhotos'

/** Alterna as fotos de início e fim do movimento, com uma transição suave. */
export default function PhotoLoop({ photos, onError }: { photos: ExercisePhotos; onError: () => void }) {
  const [second, setSecond] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setSecond((v) => !v), 1100)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="relative h-full w-full bg-white">
      {photos.src.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? 'Posição inicial' : 'Posição final'}
          onError={onError}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ opacity: (i === 1) === second ? 1 : 0, transition: 'opacity 0.45s ease' }}
        />
      ))}
      <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">
        {second ? 'Final' : 'Início'}
      </span>
    </div>
  )
}