import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroFigure from '../components/HeroFigure'
import LookEditor from '../components/LookEditor'
import { BackIcon } from '../components/SettingsIcons'
import { useGame } from '../hooks/useGame'
import { useRpg } from '../hooks/useRpg'
import { gearTiers } from '../utils/shop'
import { ACHIEVEMENTS, ACHIEVEMENT_XP, isUnlocked } from '../utils/achievements'
import { buildMissions, type Mission } from '../utils/missions'
import { RANKS, claimMission, saveName } from '../utils/rpg'

type Tab = 'perfil' | 'missoes' | 'conquistas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'missoes', label: 'Missões' },
  { id: 'conquistas', label: 'Conquistas' },
]

const n = (v: number) => Math.round(v).toLocaleString('pt-BR')

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </h2>
  )
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, pct)}%`, background: color, transition: 'width 0.5s ease' }}
      />
    </div>
  )
}

function MissionRow({ m }: { m: Mission }) {
  return (
    <li className="py-3.5">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 flex-1 text-base text-slate-50">{m.title}</span>
        <span className="shrink-0 text-sm font-semibold text-emerald-400">+{m.xp} XP</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1">
          <Bar pct={(m.value / m.target) * 100} color={m.done ? '#34d399' : '#60a5fa'} />
        </div>
        <span className="w-16 shrink-0 text-right text-xs text-slate-400">
          {n(m.value)} / {n(m.target)}
        </span>
      </div>
      {m.done && !m.claimed && (
        <button
          onClick={() => claimMission(m.id, m.xp)}
          className="mt-3 w-full rounded-xl bg-emerald-500 py-2.5 text-base font-bold text-white active:opacity-80"
        >
          Resgatar +{m.xp} XP
        </button>
      )}
      {m.claimed && <p className="mt-2 text-sm text-slate-500">Resgatada ✓</p>}
    </li>
  )
}

export default function CharacterPage() {
  const navigate = useNavigate()
  const rpg = useRpg()
  const game = useGame()
  const [tab, setTab] = useState<Tab>('perfil')
  const [editingLook, setEditingLook] = useState(false)

  if (!rpg) return <div className="p-4 text-slate-400">Carregando...</div>

  const { character: c, stats } = rpg
  const maxAttr = Math.max(25, Math.ceil(Math.max(...c.attributes.map((a) => a.value)) / 25) * 25)
  const { daily, weekly } = buildMissions(rpg, Date.now())
  const nextRank = RANKS[c.rankIndex + 1]

  function rename() {
    const name = window.prompt('Nome do personagem', rpg?.name ?? 'Atleta')
    if (name !== null && name.trim() !== '') saveName(name)
  }

  if (editingLook) {
    return (
      <LookEditor
        rankIndex={c.rankIndex}
        color={c.rank.color}
        gear={gearTiers(game)}
        onClose={() => setEditingLook(false)}
      />
    )
  }

  return (
    <div className="p-4">
      <button
        onClick={() => navigate('/')}
        className="mb-3 flex items-center gap-1 text-base text-slate-400 active:opacity-60"
      >
        <BackIcon />
        Voltar
      </button>
      <h1 className="mb-4 text-3xl font-bold text-emerald-400">Personagem</h1>

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-800 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg py-2.5 text-sm font-semibold ${
              tab === t.id ? 'bg-emerald-500 text-white' : 'text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <>
          <button
            onClick={() => navigate('/aventura')}
            className="mb-4 flex w-full items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3.5 text-left text-white active:opacity-80"
          >
            <span>
              <span className="block text-lg font-bold">⚔ Aventura</span>
              <span className="block text-sm opacity-80">Dungeons e monstros: use seu treino na batalha</span>
            </span>
            <span className="text-xl">›</span>
          </button>
          <section
            className="flex flex-col items-center rounded-3xl px-4 pb-5 pt-4 text-center"
            style={{ background: 'linear-gradient(180deg, #1d1a3a, #0e0c1f)' }}
          >
            <HeroFigure rankIndex={c.rankIndex} color={c.rank.color} size={190} gear={gearTiers(game)} />
            <button onClick={rename} className="mt-1 flex items-center gap-2 active:opacity-70">
              <span className="text-2xl font-extrabold text-white">{rpg.name}</span>
              <span className="text-sm text-[#918fa9]">✏️</span>
            </button>
            <button
              onClick={() => setEditingLook(true)}
              className="mt-2 rounded-full border border-[#4b4870] px-4 py-1.5 text-sm font-semibold text-[#cbd5e1] active:opacity-70"
            >
              🎨 Personalizar aparência
            </button>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-xs font-extrabold text-[#0e0c1f]"
                style={{ background: c.rank.color }}
              >
                RANK {c.rank.letter}
              </span>
              <span className="text-base text-[#cbd5e1]">{c.rank.title}</span>
            </div>
            <div className="mt-3 text-4xl font-extrabold text-white">Nível {c.level}</div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${c.pct}%`, background: c.rank.color, transition: 'width 0.5s ease' }}
              />
            </div>
            <div className="mt-1.5 text-sm text-[#b8b6d0]">
              {n(c.intoLevel)} / {n(c.needed)} XP para o nível {c.level + 1}
            </div>
            {nextRank && (
              <div className="mt-1 text-xs text-[#918fa9]">
                Rank {nextRank.letter} ({nextRank.title}) no nível {nextRank.min}
              </div>
            )}
          </section>

          <SectionTitle>Atributos</SectionTitle>
          <ul className="divide-y divide-slate-700/60">
            {c.attributes.map((a) => (
              <li key={a.key} className="py-3.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-medium text-slate-50">{a.label}</span>
                  <span className="text-lg font-bold text-slate-50">{a.value}</span>
                </div>
                <div className="my-1.5">
                  <Bar pct={(a.value / maxAttr) * 100} color={a.color} />
                </div>
                <div className="text-xs text-slate-500">{a.hint}</div>
              </li>
            ))}
          </ul>

          <SectionTitle>Sua jornada</SectionTitle>
          <ul className="divide-y divide-slate-700/60">
            {[
              ['Treinos finalizados', n(stats.sessions)],
              ['Séries concluídas', n(stats.sets)],
              ['Volume total levantado', `${n(stats.volume)} kg`],
              ['Recordes batidos', n(stats.prs)],
              ['Semanas na meta', n(stats.weeksOnGoal)],
              ['Maior sequência de semanas', n(stats.bestWeekStreak)],
              ['Dias na meta de calorias', n(stats.dietDays)],
              ['XP total', n(c.totalXp)],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center justify-between py-3">
                <span className="text-slate-300">{label}</span>
                <span className="font-semibold text-slate-50">{value}</span>
              </li>
            ))}
          </ul>

          <SectionTitle>Como ganhar XP</SectionTitle>
          <ul className="space-y-2 pt-2 text-sm text-slate-400">
            <li>• Finalizar um treino: 40 XP, mais 6 XP por série concluída (até 30 séries).</li>
            <li>• Volume levantado no treino: bônus de até 40 XP.</li>
            <li>• Cada recorde batido: 40 XP (até 5 por treino).</li>
            <li>• Bater a meta de dias da semana: 100 XP, mais 25 XP por semana seguida (até 4).</li>
            <li>• Registrar a dieta: 10 XP por dia, mais 20 XP se ficar na meta de calorias.</li>
            <li>• Missões resgatadas e conquistas ({ACHIEVEMENT_XP} XP cada).</li>
          </ul>
        </>
      )}

      {tab === 'missoes' && (
        <>
          <SectionTitle>Missões do dia</SectionTitle>
          <ul className="divide-y divide-slate-700/60">
            {daily.map((m) => (
              <MissionRow key={m.id} m={m} />
            ))}
          </ul>
          <p className="mt-1 text-xs text-slate-500">Novas missões todo dia.</p>

          <SectionTitle>Missões da semana</SectionTitle>
          <ul className="divide-y divide-slate-700/60">
            {weekly.map((m) => (
              <MissionRow key={m.id} m={m} />
            ))}
          </ul>
          <p className="mt-1 text-xs text-slate-500">A semana começa no domingo.</p>
          {!rpg.goal && (
            <p className="mt-4 rounded-xl bg-slate-800 p-3 text-sm text-slate-400">
              Defina sua meta diária na aba Dieta para liberar as missões de calorias e proteína.
            </p>
          )}
        </>
      )}

      {tab === 'conquistas' && (
        <>
          <p className="mb-1 text-sm text-slate-400">
            {c.unlocked} de {ACHIEVEMENTS.length} desbloqueadas · cada uma dá {ACHIEVEMENT_XP} XP.
          </p>
          <ul className="divide-y divide-slate-700/60">
            {ACHIEVEMENTS.map((a) => {
              const ok = isUnlocked(a, stats)
              const value = Math.min(a.value(stats), a.target)
              return (
                <li key={a.id} className={`flex items-center gap-4 py-3.5 ${ok ? '' : 'opacity-70'}`}>
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                      ok ? 'bg-emerald-500/20' : 'bg-slate-800 grayscale'
                    }`}
                  >
                    {a.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-slate-50">{a.title}</span>
                    <span className="block text-sm text-slate-400">{a.desc}</span>
                    {!ok && (
                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="flex-1">
                          <Bar pct={(value / a.target) * 100} color="#60a5fa" />
                        </span>
                        <span className="text-xs text-slate-500">
                          {n(value)} / {n(a.target)}
                        </span>
                      </span>
                    )}
                  </span>
                  {ok && <span className="shrink-0 text-sm font-semibold text-emerald-400">✓</span>}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}