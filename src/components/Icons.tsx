import type { ReactNode } from 'react'

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// Treinos
export function DumbbellIcon() {
  return (
    <Svg>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </Svg>
  )
}

// Exercícios (lista)
export function ListIcon() {
  return (
    <Svg>
      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </Svg>
  )
}

// Histórico (relógio)
export function ClockIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}

// Progresso (gráfico subindo)
export function TrendIcon() {
  return (
    <Svg>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </Svg>
  )
}

// Ajustes (controles deslizantes)
export function SlidersIcon() {
  return (
    <Svg>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h11M19 18h1" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Svg>
  )
}
// Assistente (balão de conversa)
export function ChatIcon() {
  return (
    <Svg>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M8 10h8M8 13h5" />
    </Svg>
  )
}