import type { ReactNode } from 'react'

function Svg({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.15 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? 'drop-shadow-[0_0_5px_currentColor]' : ''}
    >
      {children}
    </svg>
  )
}

// Treinos
export function DumbbellIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg active={active}>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
      {active && <path d="M6.5 6.5v11M17.5 6.5v11" strokeWidth="3" opacity=".28" />}
    </Svg>
  )
}

// Exercícios
export function ListIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg active={active}>
      <rect x="3" y="4" width="18" height="16" rx="3" opacity={active ? ".18" : "0"} fill="currentColor" stroke="none" />
      <path d="M9 7h10M9 12h10M9 17h10M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
    </Svg>
  )
}

// Histórico
export function ClockIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg active={active}>
      <circle cx="12" cy="12" r="9" fill={active ? 'currentColor' : 'none'} fillOpacity=".12" />
      <path d="M12 7v5l3.5 2" />
      {active && <path d="M8 3.8A9 9 0 0 1 12 3" opacity=".45" />}
    </Svg>
  )
}

// Progresso
export function TrendIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg active={active}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
      {active && <path d="M3 20h18" opacity=".3" />}
    </Svg>
  )
}

// Ajustes
export function SlidersIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg active={active}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h11M19 18h1" />
      <circle cx="16" cy="6" r="2" fill={active ? 'currentColor' : 'none'} fillOpacity=".22" />
      <circle cx="10" cy="12" r="2" fill={active ? 'currentColor' : 'none'} fillOpacity=".22" />
      <circle cx="17" cy="18" r="2" fill={active ? 'currentColor' : 'none'} fillOpacity=".22" />
    </Svg>
  )
}

// Assistente
export function ChatIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg active={active}>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill={active ? 'currentColor' : 'none'} fillOpacity=".1" />
      <path d="M8 10h8M8 13.5h5" />
    </Svg>
  )
}