import type { MonsterKind } from '../utils/battle'

interface Props {
  kind: MonsterKind
  size?: number
}

/** Desenhos simples dos monstros, no mesmo estilo de traço do personagem. */
export default function MonsterFigure({ kind, size = 150 }: Props) {
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} role="img" aria-label={kind}>
      {kind === 'slime' && (
        <g>
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1 1;1.05 0.93;1 1"
            dur="1.6s"
            repeatCount="indefinite"
            additive="sum"
          />
          <path d="M26 128 Q14 74 80 62 Q146 74 134 128 Q80 144 26 128 Z" fill="#4ade80" />
          <path d="M44 88 Q52 72 70 70" stroke="#bbf7d0" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="62" cy="100" r="11" fill="#fff" />
          <circle cx="98" cy="100" r="11" fill="#fff" />
          <circle cx="64" cy="102" r="5" fill="#052e16" />
          <circle cx="96" cy="102" r="5" fill="#052e16" />
          <path d="M68 120 Q80 128 92 120" stroke="#052e16" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      )}

      {kind === 'goblin' && (
        <g>
          <path d="M52 62 L22 44 L48 78 Z" fill="#65a30d" />
          <path d="M108 62 L138 44 L112 78 Z" fill="#65a30d" />
          <circle cx="80" cy="62" r="32" fill="#84cc16" />
          <circle cx="68" cy="58" r="6" fill="#fff" />
          <circle cx="92" cy="58" r="6" fill="#fff" />
          <circle cx="68" cy="59" r="3" fill="#b91c1c" />
          <circle cx="92" cy="59" r="3" fill="#b91c1c" />
          <path d="M66 76 Q80 86 94 76" stroke="#1a2e05" strokeWidth="4" strokeLinecap="round" fill="none" />
          <rect x="56" y="94" width="48" height="42" rx="10" fill="#92400e" />
          <path d="M56 104 L36 124" stroke="#84cc16" strokeWidth="9" strokeLinecap="round" />
          <path d="M104 104 L126 120" stroke="#84cc16" strokeWidth="9" strokeLinecap="round" />
          <path d="M126 120 L142 96" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
          <path d="M68 136 L66 152 M92 136 L94 152" stroke="#65a30d" strokeWidth="9" strokeLinecap="round" />
        </g>
      )}

      {kind === 'skeleton' && (
        <g stroke="#e2e8f0" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <circle cx="80" cy="42" r="26" fill="#e2e8f0" stroke="none" />
          <rect x="66" y="60" width="28" height="12" rx="4" fill="#e2e8f0" stroke="none" />
          <circle cx="70" cy="42" r="7" fill="#0f172a" stroke="none" />
          <circle cx="90" cy="42" r="7" fill="#0f172a" stroke="none" />
          <path d="M76 56 L80 50 L84 56" stroke="#0f172a" strokeWidth="3" />
          <path d="M80 72 L80 120" strokeWidth="6" />
          <path d="M60 84 L100 84 M62 98 L98 98 M66 112 L94 112" strokeWidth="5" />
          <path d="M58 82 L34 108 L42 128" strokeWidth="6" />
          <path d="M102 82 L128 100 L138 76" strokeWidth="6" />
          <path d="M138 76 L146 46" stroke="#94a3b8" strokeWidth="5" />
          <path d="M80 120 L66 148 M80 120 L94 148" strokeWidth="6" />
        </g>
      )}

      {kind === 'golem' && (
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -3;0 0"
            dur="2.2s"
            repeatCount="indefinite"
          />
          <rect x="52" y="14" width="56" height="40" rx="10" fill="#78716c" />
          <rect x="64" y="28" width="12" height="9" rx="2" fill="#22d3ee" />
          <rect x="86" y="28" width="12" height="9" rx="2" fill="#22d3ee" />
          <rect x="34" y="56" width="92" height="56" rx="12" fill="#57534e" />
          <path d="M60 60 L70 80 L62 96" stroke="#292524" strokeWidth="3" fill="none" />
          <rect x="10" y="58" width="26" height="52" rx="10" fill="#78716c" />
          <rect x="124" y="58" width="26" height="52" rx="10" fill="#78716c" />
          <rect x="46" y="112" width="26" height="40" rx="8" fill="#78716c" />
          <rect x="88" y="112" width="26" height="40" rx="8" fill="#78716c" />
        </g>
      )}
      {kind === 'bat' && (
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -6;0 0"
            dur="1.2s"
            repeatCount="indefinite"
          />
          <path d="M80 70 Q50 30 8 44 Q22 62 20 86 Q34 74 48 90 Q62 78 80 100 Z" fill="#6d28d9" />
          <path d="M80 70 Q110 30 152 44 Q138 62 140 86 Q126 74 112 90 Q98 78 80 100 Z" fill="#6d28d9" />
          <ellipse cx="80" cy="84" rx="20" ry="26" fill="#4c1d95" />
          <path d="M66 62 L62 40 L76 56 Z M94 62 L98 40 L84 56 Z" fill="#4c1d95" />
          <circle cx="72" cy="78" r="5" fill="#fde047" />
          <circle cx="88" cy="78" r="5" fill="#fde047" />
          <path d="M74 92 L77 100 L80 92 L83 100 L86 92" stroke="#fff" strokeWidth="3" fill="none" strokeLinejoin="round" />
        </g>
      )}

      {kind === 'orc' && (
        <g>
          <circle cx="80" cy="46" r="30" fill="#4d7c0f" />
          <path d="M60 64 L56 80 L66 70 Z M100 64 L104 80 L94 70 Z" fill="#fff" />
          <circle cx="68" cy="42" r="5" fill="#fff" />
          <circle cx="92" cy="42" r="5" fill="#fff" />
          <circle cx="68" cy="43" r="2.5" fill="#7f1d1d" />
          <circle cx="92" cy="43" r="2.5" fill="#7f1d1d" />
          <path d="M60 32 L74 38 M100 32 L86 38" stroke="#1a2e05" strokeWidth="4" strokeLinecap="round" />
          <path d="M68 60 Q80 54 92 60" stroke="#1a2e05" strokeWidth="4" strokeLinecap="round" fill="none" />
          <rect x="38" y="78" width="84" height="48" rx="14" fill="#3f6212" />
          <rect x="50" y="86" width="60" height="14" rx="4" fill="#78350f" />
          <rect x="14" y="82" width="26" height="40" rx="10" fill="#4d7c0f" />
          <rect x="120" y="82" width="26" height="40" rx="10" fill="#4d7c0f" />
          <path d="M146 40 L146 118" stroke="#92400e" strokeWidth="7" strokeLinecap="round" />
          <path d="M132 40 L160 40 L146 18 Z" fill="#cbd5e1" />
          <rect x="48" y="124" width="24" height="30" rx="8" fill="#365314" />
          <rect x="88" y="124" width="24" height="30" rx="8" fill="#365314" />
        </g>
      )}

      {kind === 'wraith' && (
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -8;0 0"
            dur="2.6s"
            repeatCount="indefinite"
          />
          <path d="M80 14 Q36 22 34 76 L24 146 L48 128 L64 152 L80 130 L96 152 L112 128 L136 146 L126 76 Q124 22 80 14 Z" fill="#0ea5e9" opacity="0.55" />
          <path d="M80 14 Q36 22 34 76 L40 90 Q80 70 120 90 L126 76 Q124 22 80 14 Z" fill="#0c4a6e" opacity="0.8" />
          <ellipse cx="66" cy="62" rx="9" ry="12" fill="#e0f2fe" />
          <ellipse cx="94" cy="62" rx="9" ry="12" fill="#e0f2fe" />
          <circle cx="66" cy="64" r="4" fill="#0f172a" />
          <circle cx="94" cy="64" r="4" fill="#0f172a" />
          <ellipse cx="80" cy="96" rx="9" ry="12" fill="#0f172a" opacity="0.8" />
        </g>
      )}

      {kind === 'dragon' && (
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -3;0 0"
            dur="2s"
            repeatCount="indefinite"
          />
          <path d="M30 100 Q4 60 18 24 Q34 52 56 66 Z" fill="#7f1d1d" />
          <path d="M130 100 Q156 60 142 24 Q126 52 104 66 Z" fill="#7f1d1d" />
          <path d="M104 120 Q150 128 150 150 Q130 140 110 146 Z" fill="#b91c1c" />
          <ellipse cx="80" cy="104" rx="38" ry="34" fill="#b91c1c" />
          <ellipse cx="80" cy="116" rx="22" ry="20" fill="#fca5a5" />
          <path d="M58 56 L50 24 L68 46 Z M102 56 L110 24 L92 46 Z" fill="#fde68a" />
          <ellipse cx="80" cy="60" rx="30" ry="26" fill="#dc2626" />
          <ellipse cx="80" cy="72" rx="16" ry="11" fill="#b91c1c" />
          <circle cx="74" cy="72" r="2.5" fill="#450a0a" />
          <circle cx="86" cy="72" r="2.5" fill="#450a0a" />
          <path d="M60 52 L72 56 M100 52 L88 56" stroke="#450a0a" strokeWidth="4" strokeLinecap="round" />
          <circle cx="66" cy="52" r="4" fill="#fde047" />
          <circle cx="94" cy="52" r="4" fill="#fde047" />
          <path d="M52 134 L50 152 M108 134 L110 152" stroke="#991b1b" strokeWidth="11" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}