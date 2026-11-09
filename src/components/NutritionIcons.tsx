type IconProps = { active?: boolean; size?: number }

export function ForkIcon({ active = false, size = 22 }: IconProps) {
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
      {active && <path d="M17 3.5a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3z" fill="currentColor" opacity=".16" stroke="none" />}
      <path d="M6 3.5v5a2.5 2.5 0 0 0 5 0v-5M8.5 3.5v17" />
      <path d="M17 20.5V3.5a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3" />
    </svg>
  )
}
