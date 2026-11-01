import { useLook } from '../hooks/useLook'
import { BOTTOM_COLORS, HAIR_COLORS, SHIRTS, SKINS, shade, type Look } from '../utils/look'

interface Props {
  rankIndex: number // 0 = rank E ... 5 = rank S
  color: string
  size?: number
  gear?: { weapon: number; armor: number; charm: number } // nível 0 a 6 do equipamento
  look?: Look // aparência; se não vier, usa a que o jogador escolheu
}

const TIER_COLORS = ['#94a3b8', '#94a3b8', '#cbd5e1', '#60a5fa', '#a78bfa', '#f59e0b', '#f43f5e']

/** Herói do FitFlow: usa a aparência escolhida, fica mais imponente a cada rank e mostra o equipamento. */
export default function HeroFigure({ rankIndex, color, size = 200, gear, look: lookProp }: Props) {
  const stored = useLook()
  const look = lookProp ?? stored
  const female = look.body === 'f'
  const SKIN = SKINS[look.skin]
  const SKIN_SHADE = shade(SKIN, 0.1)
  const HAIR = HAIR_COLORS[look.hairColor]
  const BOTTOM = BOTTOM_COLORS[look.bottomColor]
  const lx = female ? 78 : 72 // x do ombro esquerdo
  const rx = 200 - lx
  const style = look.hairStyle // 0 espetado 1 curto 2 longo 3 rabo 4 coque 5 trança

  const aura = 0.1 + rankIndex * 0.05
  const gradId = `aura-${rankIndex}`
  const armorT = gear?.armor ?? 0
  const weaponT = gear?.weapon ?? 0
  const charmT = gear?.charm ?? 0
  const shirt = armorT > 0 ? TIER_COLORS[armorT] : SHIRTS[look.shirt]
  const bladeLen = 34 + weaponT * 6

  // tronco: o feminino é mais estreito, com cintura marcada
  const torso = female
    ? 'M78 95 Q100 87 122 95 L117 124 Q123 137 124 150 Q100 158 76 150 Q77 137 83 124 Z'
    : 'M72 94 Q100 84 128 94 L124 150 Q100 156 76 150 Z'
  const plate = female
    ? 'M81 97 Q100 90 119 97 L114 124 Q119 136 120 147 Q100 153 80 147 Q81 136 86 124 Z'
    : 'M76 96 Q100 88 124 96 L120 146 Q100 152 80 146 Z'
  const beltL = female ? 77 : 75
  const beltW = female ? 46 : 50

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={(size * 240) / 200}
      role="img"
      aria-label="Seu personagem"
    >
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0%" stopColor={color} stopOpacity={aura + 0.25} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* aura que pulsa */}
      <circle cx="100" cy="130" r="92" fill={`url(#${gradId})`}>
        <animate attributeName="r" values="88;100;88" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* raios do rank S */}
      {rankIndex >= 5 &&
        Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 74}
              y1={130 + Math.sin(a) * 74}
              x2={100 + Math.cos(a) * 106}
              y2={130 + Math.sin(a) * 106}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.55"
            />
          )
        })}

      {/* sombra no chão */}
      <ellipse cx="100" cy="226" rx="40" ry="6" fill="#000" opacity="0.28" />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0;0 -3;0 0"
          dur="2.4s"
          repeatCount="indefinite"
        />

        {/* capa (rank B ou mais) */}
        {rankIndex >= 3 && (
          <g>
            <path d="M74 92 Q36 160 52 218 L100 196 L148 218 Q164 160 126 92 Z" fill={color} opacity="0.5" />
            <path d="M84 100 Q60 160 72 206 L100 190 L128 206 Q140 160 116 100 Z" fill="#000" opacity="0.18" />
          </g>
        )}

        {/* cabelo de trás (longo e rabo de cavalo ficam atrás do corpo) */}
        {style === 2 && (
          <path d="M68 54 Q54 110 70 152 Q88 132 84 94 L116 94 Q112 132 130 152 Q146 110 132 54 Z" fill={HAIR} />
        )}
        {style === 3 && (
          <g>
            <path d="M120 42 Q164 38 158 112 Q150 84 124 68 Z" fill={HAIR} />
            <path d="M130 52 Q152 58 152 92" stroke="#fff" strokeOpacity="0.18" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* pernas (pele) */}
        <rect x="77" y="144" width="20" height="62" rx="9" fill={SKIN} />
        <rect x="103" y="144" width="20" height="62" rx="9" fill={SKIN} />
        {/* parte de baixo */}
        {look.bottom === 0 && (
          <g fill={BOTTOM}>
            <rect x="77" y="144" width="20" height="62" rx="9" />
            <rect x="103" y="144" width="20" height="62" rx="9" />
          </g>
        )}
        {look.bottom === 1 && (
          <g fill={BOTTOM}>
            <rect x="76" y="144" width="22" height="34" rx="9" />
            <rect x="102" y="144" width="22" height="34" rx="9" />
          </g>
        )}
        {look.bottom === 2 && (
          <g>
            <path d="M76 146 L124 146 L136 190 Q100 198 64 190 Z" fill={BOTTOM} />
            <path d="M66 184 Q100 192 134 184" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" fill="none" />
          </g>
        )}

        {/* botas */}
        <rect x="72" y="198" width="30" height="20" rx="8" fill="#1e293b" />
        <rect x="98" y="198" width="30" height="20" rx="8" fill="#1e293b" />
        <rect x="72" y="204" width="30" height="4" fill={rankIndex >= 1 ? color : '#475569'} />
        <rect x="98" y="204" width="30" height="4" fill={rankIndex >= 1 ? color : '#475569'} />

        {/* braço esquerdo */}
        <path d={`M${lx + 2} 98 L58 126`} stroke={shirt} strokeWidth={female ? 12 : 14} strokeLinecap="round" />
        <circle cx="57" cy="132" r="7.5" fill={SKIN} />
        {rankIndex >= 1 && <circle cx="57" cy="132" r="8" fill="none" stroke={color} strokeWidth="3" opacity="0.9" />}

        {/* tronco */}
        <path d={torso} fill={shirt} />
        <path d={`M${lx} 94 Q100 85 ${rx} 94 L${rx - 1} 104 Q100 95 ${lx + 1} 104 Z`} fill="#fff" opacity="0.12" />
        {armorT > 0 && (
          <g>
            <path
              d={plate}
              fill={TIER_COLORS[armorT]}
              stroke="#0f172a"
              strokeOpacity="0.35"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M100 92 L100 150" stroke="#0f172a" strokeOpacity="0.3" strokeWidth="2" />
            <path d="M85 110 Q100 118 115 110" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {armorT >= 3 && <circle cx="100" cy="124" r="5" fill="#fff" opacity="0.55" />}
          </g>
        )}

        {/* cinto (rank C ou mais) */}
        {rankIndex >= 2 && (
          <g>
            <rect x={beltL} y="142" width={beltW} height="10" rx="3" fill={color} />
            <rect x="94" y="140" width="12" height="14" rx="3" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
          </g>
        )}

        {/* pescoço */}
        <rect x="93" y="80" width="14" height="12" rx="4" fill={SKIN_SHADE} />

        {/* trança (cai sobre o ombro esquerdo, saindo de trás da cabeça) */}
        {style === 5 && (
          <g fill={HAIR} stroke="#fff" strokeOpacity="0.15" strokeWidth="1.2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ellipse key={i} cx={78 - i * 1.4} cy={80 + i * 11} rx={6.6 - i * 0.45} ry="6.4" />
            ))}
            <circle cx="70.5" cy="141" r="3.6" fill={color} stroke="none" />
          </g>
        )}

        {/* amuleto */}
        {charmT > 0 && (
          <g>
            <path d="M88 92 Q100 112 112 92" stroke={TIER_COLORS[charmT]} strokeWidth="2" fill="none" />
            {charmT >= 3 && <circle cx="100" cy="106" r={8 + charmT} fill={TIER_COLORS[charmT]} opacity="0.25" />}
            <circle cx="100" cy="106" r={3.5 + charmT * 0.6} fill={TIER_COLORS[charmT]} stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" />
          </g>
        )}

        {/* ombreiras (rank A ou mais) */}
        {rankIndex >= 4 && (
          <g>
            <ellipse cx={lx} cy="96" rx="13" ry="10" fill={color} stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
            <ellipse cx={rx} cy="96" rx="13" ry="10" fill={color} stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
          </g>
        )}

        {/* braço direito + mão */}
        <path d={`M${rx - 2} 98 L140 124`} stroke={shirt} strokeWidth={female ? 12 : 14} strokeLinecap="round" />

        {/* espada */}
        {weaponT > 0 && (
          <g strokeLinecap="round">
            {weaponT >= 4 && (
              <path d={`M142 112 L142 ${112 - bladeLen}`} stroke={TIER_COLORS[weaponT]} strokeWidth="14" opacity="0.28" />
            )}
            <path
              d={`M142 112 L142 ${112 - bladeLen}`}
              stroke={TIER_COLORS[weaponT]}
              strokeWidth={5 + Math.floor(weaponT / 2)}
            />
            <path d={`M142 112 L142 ${112 - bladeLen}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" />
            <path d="M132 114 L152 114" stroke="#fbbf24" strokeWidth="5" />
            <path d="M142 114 L142 130" stroke="#92400e" strokeWidth="5" />
          </g>
        )}
        <circle cx="142" cy="124" r="7.5" fill={SKIN} />
        {rankIndex >= 1 && <circle cx="142" cy="124" r="8" fill="none" stroke={color} strokeWidth="3" opacity="0.9" />}

        {/* volume do cabelo atrás da cabeça */}
        <ellipse cx="100" cy="55" rx="29" ry="30" fill={HAIR} />

        {/* cabeça */}
        {style !== 2 && (
          <>
            <circle cx="75" cy="68" r="5" fill={SKIN_SHADE} />
            <circle cx="125" cy="68" r="5" fill={SKIN_SHADE} />
          </>
        )}
        <circle cx="100" cy="63" r="27" fill={SKIN} />

        {/* detalhes do cabelo conforme o estilo */}
        {style === 0 && (
          <path d="M72 44 L74 16 L89 30 L100 6 L111 30 L126 16 L128 44 Z" fill={HAIR} />
        )}
        {style === 4 && (
          <g>
            <circle cx="100" cy="20" r="13" fill={HAIR} />
            <path d="M88 32 Q100 26 112 32" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        )}
        {style === 2 && (
          <g fill={HAIR}>
            <path d="M70 60 Q60 100 66 136 Q77 124 79 100 Q77 80 75 62 Z" />
            <path d="M130 60 Q140 100 134 136 Q123 124 121 100 Q123 80 125 62 Z" />
          </g>
        )}
        {style === 3 && <circle cx="122" cy="46" r="4.5" fill={color} />}

        {/* franja */}
        <path
          d="M71 64 Q64 24 100 22 Q136 24 129 64 Q122 52 112 46 Q104 42 100 44 Q96 42 88 46 Q78 52 71 64 Z"
          fill={HAIR}
        />
        <path d="M82 34 Q94 28 108 30" stroke="#fff" strokeOpacity="0.22" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* rosto */}
        <ellipse cx="90" cy="66" rx={female ? 3.9 : 3.4} ry={female ? 5.4 : 4.8} fill="#1e293b" />
        <ellipse cx="110" cy="66" rx={female ? 3.9 : 3.4} ry={female ? 5.4 : 4.8} fill="#1e293b" />
        <circle cx="91.2" cy="64.4" r="1.4" fill="#fff" />
        <circle cx="111.2" cy="64.4" r="1.4" fill="#fff" />
        {female && (
          <path d="M85 62 L82 59 M115 62 L118 59" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        )}
        <path
          d="M84 60 Q90 57 96 59 M116 60 Q110 57 104 59"
          stroke={HAIR}
          strokeWidth={female ? 1.8 : 2.4}
          strokeLinecap="round"
        />
        <circle cx="84" cy="74" r="4" fill="#fb7185" opacity="0.3" />
        <circle cx="116" cy="74" r="4" fill="#fb7185" opacity="0.3" />
        <path
          d="M94 76 Q100 81 106 76"
          stroke={female ? '#be123c' : '#7c2d12'}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* faixa na testa (rank D ou mais) */}
        {rankIndex >= 1 && (
          <g fill={color}>
            <path d="M73 52 Q100 44 127 52 L127 59 Q100 51 73 59 Z" />
            <path d="M125 54 L146 62 L134 66 Z" />
            <path d="M125 55 L144 47 L136 58 Z" />
          </g>
        )}

        {/* coroa (rank S) */}
        {rankIndex >= 5 && (
          <path
            d="M80 36 L84 18 L93 30 L100 12 L107 30 L116 18 L120 36 Z"
            fill="#fbbf24"
            stroke={color}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}
      </g>
    </svg>
  )
}