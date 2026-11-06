// made by: Gabriel Mattos
import { MUSCLE_GROUPS } from '../types'
import type { GroupFilter } from '../utils/filterExercises'

// 'page' = tela normal (fundo escuro); 'sheet' = dentro de um modal (o fundo do modal já é
// slate-800, então os campos usam um cinza um pouco mais escuro para não sumirem).
const SURFACE = {
  page: { field: 'bg-slate-800', pillOff: 'bg-slate-800', bleed: '-mx-4 px-4' },
  sheet: { field: 'bg-slate-900', pillOff: 'bg-slate-900', bleed: '-mx-5 px-5' },
} as const

interface Props {
  search: string
  onSearch: (value: string) => void
  group: GroupFilter
  onGroup: (group: GroupFilter) => void
  surface?: keyof typeof SURFACE
}

/** Busca + pílulas de grupo muscular. Usado na aba Exercícios e no modal "Escolher exercício". */
export default function ExerciseFilters({ search, onSearch, group, onGroup, surface = 'page' }: Props) {
  const s = SURFACE[surface]
  return (
    <>
      <div className="relative mb-3">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className={`w-full rounded-xl ${s.field} py-3 pl-11 pr-4 text-base text-slate-50 outline-none placeholder:text-slate-500`}
          placeholder="Buscar exercício"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className={`${s.bleed} flex gap-2 overflow-x-auto pb-1`}>
        {(['Todos', ...MUSCLE_GROUPS] as const).map((g) => (
          <button
            key={g}
            onClick={() => onGroup(g)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              group === g ? 'bg-emerald-500 text-white' : `${s.pillOff} text-slate-300`
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </>
  )
}
