import type { ReactNode } from 'react'

type IconProps = { active?: boolean; size?: number }

function Svg({
  children,
  active = false,
  size = 26,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 1.9 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function DumbbellIcon({ active = false, size }: IconProps) {
  return (
    <Svg active={active} size={size}>
      {active && <path d="M8 10.5h8v3H8z" fill="currentColor" opacity=".18" stroke="none" />}
      <path d="M7.5 7v10M16.5 7v10M4.5 9v6M19.5 9v6M7.5 12h9" />
      <path d="M6.5 9.5v5M17.5 9.5v5" opacity=".65" />
    </Svg>
  )
}

export function ListIcon({ active = false, size }: IconProps) {
  return (
    <Svg active={active} size={size}>
      {active && <rect x="5.25" y="3.75" width="13.5" height="16.5" rx="2.5" fill="currentColor" opacity=".12" stroke="none" />}
      <rect x="5.25" y="3.75" width="13.5" height="16.5" rx="2.5" />
      <path d="m8 8 .8.8L10.2 7.4M12.5 8h3M8 12l.8.8 1.4-1.4M12.5 12h3M8 16h.01M12.5 16h3" />
    </Svg>
  )
}

export function ClockIcon({ active = false, size }: IconProps) {
  return (
    <Svg active={active} size={size}>
      {active && <circle cx="12" cy="12" r="7.5" fill="currentColor" opacity=".14" stroke="none" />}
      <path d="M4.7 8.7A8 8 0 1 1 4 12" />
      <path d="M2.5 5.5v3.7h3.7M12 7.5v4.8l3 1.8" />
    </Svg>
  )
}

export function TrendIcon({ active = false, size }: IconProps) {
  return (
    <Svg active={active} size={size}>
      {active && <path d="M5 17.5 9.2 13l3 2.4 6.3-7.1v8.2H5z" fill="currentColor" opacity=".14" stroke="none" />}
      <path d="M4.5 19.5h15M5 17.5 9.2 13l3 2.4 6.3-7.1" />
      <path d="M15.5 8.3h4v4" />
      <circle cx="9.2" cy="13" r=".8" fill="currentColor" stroke="none" />
      <circle cx="12.2" cy="15.4" r=".8" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function SlidersIcon({ active = false, size }: IconProps) {
  return (
    <Svg active={active} size={size}>
      <path d="M4 6.5h4m4 0h8M4 12h9m4 0h3M4 17.5h2m4 0h10" />
      <circle cx="10" cy="6.5" r="2" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? '.2' : undefined} />
      <circle cx="15" cy="12" r="2" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? '.2' : undefined} />
      <circle cx="8" cy="17.5" r="2" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? '.2' : undefined} />
    </Svg>
  )
}

export function ChatIcon({ active = false, size }: IconProps) {
  return (
    <Svg active={active} size={size}>
      {active && <path d="M5 5.5h14v10H12l-4.5 3v-3H5z" fill="currentColor" opacity=".13" stroke="none" />}
      <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-7l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 14V7A1.5 1.5 0 0 1 5 5.5Z" />
      <path d="m11.5 8.5.7 1.7 1.8.7-1.8.7-.7 1.9-.7-1.9-1.8-.7 1.8-.7zM16.5 11.5v2" />
    </Svg>
  )
}
