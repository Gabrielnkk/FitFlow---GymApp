export function ForkIcon({ active = false }: { active?: boolean }) {
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
      <path d="M7 3v7a2 2 0 0 0 2 2v9" />
      <path d="M5 3v5M9 3v5" />
      <path d="M17 21V3c-2.5 1.5-3.5 4.5-3.5 8H17" fill={active ? 'currentColor' : 'none'} fillOpacity=".12" />
    </svg>
  )
}