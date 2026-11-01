import { useState } from 'react'

interface Props {
  value: number
  onChange: (value: number) => void
  decimal?: boolean
}

function parse(text: string): number {
  const n = parseFloat(text.replace(',', '.'))
  return Number.isNaN(n) || n < 0 ? 0 : n
}

export default function NumberField({ value, onChange, decimal = false }: Props) {
  const [text, setText] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)

  if (value !== lastValue) {
    setLastValue(value)
    if (parse(text) !== value) setText(String(value))
  }

  return (
    <input
      className="w-full rounded-lg bg-slate-900 px-2 py-3 text-center text-lg text-slate-50 outline-none ring-1 ring-slate-600 focus:ring-emerald-400"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value)
        onChange(parse(e.target.value))
      }}
    />
  )
}