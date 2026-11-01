import { useState } from 'react'

export interface PickerOption<T extends string | number> {
  value: T | ''
  label: string
}

interface Props<T extends string | number> {
  title: string
  value: T | ''
  options: PickerOption<T>[]
  onChange: (value: T | '') => void
}

// Menu de seleção bonito: um botão que abre uma lista que sobe de baixo da tela
export default function PickerSelect<T extends string | number>({
  title,
  value,
  options,
  onChange,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value) ?? options[0]

  return (
    <>
      <button
        type="button"
        aria-label={title}
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-slate-50 ring-1 ring-slate-600 active:bg-slate-700"
      >
        <span>{current?.label}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="sheet-enter max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-slate-600 bg-slate-800 p-4 text-left"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-600" />
            <h3 className="mb-3 text-center text-lg font-bold text-slate-50">{title}</h3>
            <ul className="space-y-2">
              {options.map((o) => {
                const selected = o.value === value
                return (
                  <li key={String(o.value)}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.value)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-semibold ${
                        selected ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      <span>{o.label}</span>
                      {selected && <span>✓</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}