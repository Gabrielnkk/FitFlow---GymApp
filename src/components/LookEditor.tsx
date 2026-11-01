import { useLook } from '../hooks/useLook'
import {
  BOTTOM_COLORS,
  BOTTOM_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  SHIRTS,
  SKINS,
  saveLook,
  type Look,
} from '../utils/look'
import HeroFigure from './HeroFigure'

interface Props {
  rankIndex: number
  color: string
  gear: { weapon: number; armor: number; charm: number }
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Swatches({
  colors,
  value,
  onPick,
}: {
  colors: string[]
  value: number
  onPick: (i: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((c, i) => (
        <button
          key={c}
          onClick={() => onPick(i)}
          aria-label={`Cor ${i + 1}`}
          className="h-11 w-11 rounded-full active:opacity-70"
          style={{
            background: c,
            border: value === i ? '3px solid #ffffff' : '3px solid transparent',
            boxShadow: value === i ? '0 0 0 2px #3b82f6' : 'inset 0 0 0 1px rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  )
}

function Choices({
  options,
  value,
  onPick,
}: {
  options: string[]
  value: number
  onPick: (i: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onPick(i)}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold active:opacity-80 ${
            value === i ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export default function LookEditor({ rankIndex, color, gear, onClose }: Props) {
  const look = useLook()
  const set = (patch: Partial<Look>) => saveLook({ ...look, ...patch })

  return (
    <div className="p-4 pb-10">
      <h1 className="mb-3 text-3xl font-bold text-emerald-400">Aparência</h1>

      <section
        className="flex justify-center rounded-3xl py-3"
        style={{ background: 'linear-gradient(180deg, #1d1a3a, #0e0c1f)' }}
      >
        <HeroFigure rankIndex={rankIndex} color={color} size={190} gear={gear} />
      </section>

      <Section title="Corpo">
        <Choices
          options={['Masculino', 'Feminino']}
          value={look.body === 'f' ? 1 : 0}
          onPick={(i) => set({ body: i === 1 ? 'f' : 'm' })}
        />
      </Section>
      <Section title="Pele">
        <Swatches colors={SKINS} value={look.skin} onPick={(i) => set({ skin: i })} />
      </Section>
      <Section title="Cabelo">
        <Choices options={HAIR_STYLES} value={look.hairStyle} onPick={(i) => set({ hairStyle: i })} />
        <div className="mt-3">
          <Swatches colors={HAIR_COLORS} value={look.hairColor} onPick={(i) => set({ hairColor: i })} />
        </div>
      </Section>
      <Section title="Camiseta">
        <Swatches colors={SHIRTS} value={look.shirt} onPick={(i) => set({ shirt: i })} />
        <p className="mt-2 text-xs text-slate-500">Se você comprar uma armadura, ela cobre a camiseta.</p>
      </Section>
      <Section title="Parte de baixo">
        <Choices options={BOTTOM_STYLES} value={look.bottom} onPick={(i) => set({ bottom: i })} />
        <div className="mt-3">
          <Swatches colors={BOTTOM_COLORS} value={look.bottomColor} onPick={(i) => set({ bottomColor: i })} />
        </div>
      </Section>

      <button
        onClick={onClose}
        className="mt-6 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white active:opacity-80"
      >
        Pronto
      </button>
    </div>
  )
}