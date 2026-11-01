import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_PLATES, calcPlates, getPlateConfig, groupPlates, savePlateConfig } from '../utils/plates'

const BARS = [20, 15, 10, 7]

function fmt(n: number): string {
  return String(n).replace('.', ',')
}

export default function PlatesPage() {
  const [config, setConfig] = useState(getPlateConfig)
  const [text, setText] = useState('')

  const target = parseFloat(text.replace(',', '.'))
  const valid = !Number.isNaN(target) && target > 0
  const result = valid ? calcPlates(target, config.bar, config.plates) : null
  const groups = result ? groupPlates(result.perSide) : []

  function update(next: typeof config) {
    setConfig(next)
    savePlateConfig(next)
  }

  function togglePlate(p: number) {
    const has = config.plates.includes(p)
    update({ ...config, plates: has ? config.plates.filter((x) => x !== p) : [...config.plates, p] })
  }

  return (
    <div className="p-4">
      <Link to="/ajustes" className="text-sm text-emerald-400">
        ‹ Voltar
      </Link>
      <h1 className="mb-4 mt-1 text-3xl font-bold text-emerald-400">Calculadora de anilhas</h1>

      <label className="mb-1 block text-sm text-slate-300">Carga total na barra (kg)</label>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ex.: 100"
        className="mb-4 w-full rounded-xl bg-slate-800 p-4 text-2xl font-bold"
      />

      {result && (
        <section className="mb-5 rounded-xl bg-slate-800 p-4">
          {result.perSide.length === 0 ? (
            <p className="text-slate-300">
              {target <= config.bar
                ? `Só a barra (${fmt(config.bar)} kg).`
                : 'Não há anilha pequena o bastante para essa carga.'}
            </p>
          ) : (
            <>
              <div className="mb-2 text-sm text-slate-400">De cada lado da barra:</div>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <div key={g.plate} className="rounded-lg bg-emerald-500 px-4 py-2 text-center">
                    <div className="text-xl font-bold">{fmt(g.plate)} kg</div>
                    <div className="text-xs">× {g.count}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="mt-3 text-sm text-slate-300">
            Total montado: <b>{fmt(result.total)} kg</b>
            {!result.exact && (
              <span className="text-amber-400"> (o mais próximo possível com essas anilhas)</span>
            )}
          </div>
        </section>
      )}

      <h2 className="mb-2 text-lg font-bold">Peso da barra</h2>
      <div className="mb-5 flex flex-wrap gap-2">
        {BARS.map((b) => (
          <button
            key={b}
            onClick={() => update({ ...config, bar: b })}
            className={`rounded-lg px-4 py-2 font-bold ${
              config.bar === b ? 'bg-emerald-500' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {b} kg
          </button>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-bold">Anilhas disponíveis</h2>
      <div className="flex flex-wrap gap-2">
        {ALL_PLATES.map((p) => (
          <button
            key={p}
            onClick={() => togglePlate(p)}
            className={`rounded-lg px-4 py-2 font-bold ${
              config.plates.includes(p) ? 'bg-emerald-500' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {fmt(p)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">Toque para ligar ou desligar cada anilha.</p>
    </div>
  )
}