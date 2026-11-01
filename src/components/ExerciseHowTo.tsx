import { useState } from 'react'
import { photosFor } from '../data/exercisePhotos'
import { patternFor } from '../data/howto'
import Modal from './Modal'
import PhotoLoop from './PhotoLoop'

export default function ExerciseHowTo({ name }: { name: string }) {
  const [open, setOpen] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const pattern = patternFor(name)
  const photos = photosFor(name)
  const showPhotos = photos !== null && !photoFailed

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-700 px-2 py-1 text-xs font-semibold text-emerald-400"
      >
        ▶ Como fazer
      </button>

      {open && (
        <Modal title={name} onClose={() => setOpen(false)}>
          {showPhotos && photos && (
            <div className="mb-4 h-64 overflow-hidden rounded-2xl border border-[#2b3672]">
              <PhotoLoop photos={photos} onError={() => setPhotoFailed(true)} />
            </div>
          )}

          <h3 className="mb-2 text-sm font-bold tracking-wider text-slate-400">COMO FAZER</h3>
          <ol className="mb-4 list-decimal space-y-2 pl-5">
            {pattern.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <div className="rounded-xl bg-slate-700 p-3 text-sm">
            <b className="text-emerald-400">Dica:</b> {pattern.tip}
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            {showPhotos
              ? 'Fotos ilustrativas. A postura exata pode variar conforme o aparelho.'
              : 'Sem foto para este exercício. A postura exata pode variar conforme o aparelho.'}
          </p>
        </Modal>
      )}
    </>
  )
}