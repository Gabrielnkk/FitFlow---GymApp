import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroFigure from '../components/HeroFigure'
import MonsterFigure from '../components/MonsterFigure'
import { BackIcon } from '../components/SettingsIcons'
import { useGame } from '../hooks/useGame'
import { useRpg } from '../hooks/useRpg'
import {
  DUNGEONS,
  TOWER,
  towerMonster,
  lootFor,
  newBattle,
  playTurn,
  playerStatsFrom,
  type Action,
  type BattleState,
  type Dungeon,
} from '../utils/battle'
import {
  MAX_POTIONS,
  todayKey,
  energyAvailable,
  ensureGame,
  finishRun,
  spendEnergy,
  type RunResult,
} from '../utils/gameState'
import { RANKS } from '../utils/rpg'
import { gearBonus, gearTiers } from '../utils/shop'

interface Run {
  dungeon: Dungeon
  floor: number
  potions: number // poções que você leva para o próximo andar
  gold: number
  kills: number
  tower?: { start: number } // se for a Torre, o andar em que a subida começou
}

interface Summary {
  won: boolean
  dungeon: Dungeon
  gold: number // ouro que entrou na carteira
  firstClear: boolean
  dailyBonus: boolean
  kills: number
  towerFloor?: number
  newRecord?: boolean
}

type View = 'lobby' | 'battle' | 'between' | 'result'

const n = (v: number) => Math.round(v).toLocaleString('pt-BR')

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`,
          background: color,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

const darkCard = { background: 'linear-gradient(180deg, #1d1a3a, #0e0c1f)' }

export default function GamePage() {
  const navigate = useNavigate()
  const rpg = useRpg()
  const game = useGame()

  const [view, setView] = useState<View>('lobby')
  const [towerStart, setTowerStart] = useState<number | null>(null)
  const [run, setRun] = useState<Run | null>(null)
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [lastLoot, setLastLoot] = useState<{ gold: number; potions: number } | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [hit, setHit] = useState<{ m: boolean; p: boolean }>({ m: false, p: false })

  useEffect(() => {
    ensureGame()
  }, [])

  const stats = useMemo(
    () => (rpg && game ? playerStatsFrom(rpg.character, gearBonus(game)) : null),
    [rpg, game],
  )

  if (!rpg || !stats || !game) return <div className="p-4 text-slate-400">Carregando...</div>

  const c = rpg.character
  // andares de partida: 1 e cada chefe já vencido (11, 21, 31...)
  const towerStarts = Array.from({ length: Math.floor(game.towerBest / 10) + 1 }, (_, i) => i * 10 + 1)
  const towerFrom = towerStart !== null && towerStarts.includes(towerStart) ? towerStart : towerStarts[towerStarts.length - 1]
  const energy = energyAvailable(game, rpg.finished, rpg.stats.setsBySession)
  const monster =
    run && view !== 'lobby'
      ? run.tower
        ? towerMonster(run.tower.start + run.floor)
        : run.dungeon.floors[run.floor]
      : null

  function start(d: Dungeon) {
    if (!game || !stats || energy < d.cost) return
    const g = spendEnergy(game, d.cost)
    setRun({ dungeon: d, floor: 0, potions: g.potions, gold: 0, kills: 0 })
    setBattle(newBattle(stats, d.floors[0], g.potions))
    setLastLoot(null)
    setView('battle')
  }

  function startTower(from: number) {
    if (!game || !stats || energy < TOWER.cost) return
    const g = spendEnergy(game, TOWER.cost)
    setRun({ dungeon: TOWER, floor: 0, potions: g.potions, gold: 0, kills: 0, tower: { start: from } })
    setBattle(newBattle(stats, towerMonster(from), g.potions))
    setLastLoot(null)
    setView('battle')
  }

  function end(won: boolean, r: Run, potionsLeft: number) {
    if (!game) return
    const result: RunResult = {
      dungeonId: r.dungeon.id,
      won,
      gold: r.gold,
      firstClearGold: r.dungeon.firstClearGold,
      potionsLeft,
      kills: r.kills,
      ...(r.tower ? { towerFloor: r.kills > 0 ? r.tower.start + r.kills - 1 : 0 } : {}),
    }
    const out = finishRun(game, result)
    setSummary({
      won,
      dungeon: r.dungeon,
      gold: out.gold,
      firstClear: out.firstClear,
      dailyBonus: out.dailyBonus,
      kills: r.kills,
      ...(r.tower ? { towerFloor: r.kills > 0 ? r.tower.start + r.kills - 1 : 0, newRecord: out.newRecord } : {}),
    })
    setView('result')
  }

  function act(action: Action) {
    if (!battle || !run || !stats || !monster || battle.over) return
    const next = playTurn(battle, action, stats, monster, Math.random)
    if (next === battle) return
    setBattle(next)
    setHit({ m: next.lastHit.monster > 0, p: next.lastHit.player > 0 })
    window.setTimeout(() => setHit({ m: false, p: false }), 220)

    if (next.over === 'win') {
      const loot = lootFor(monster, Math.random)
      let extraGold = 0
      if (run.tower && game) {
        const floorNo = run.tower.start + run.floor
        // marco: primeira vez que você vence o chefe de um andar múltiplo de 10
        if (floorNo % 10 === 0 && floorNo > game.towerBest) extraGold = 100 * (floorNo / 10)
      }
      loot.gold += extraGold
      const updated: Run = {
        ...run,
        gold: run.gold + loot.gold,
        kills: run.kills + 1,
        potions: Math.min(MAX_POTIONS, next.potions + loot.potions),
      }
      setRun(updated)
      setLastLoot(loot)
      if (!run.tower && run.floor + 1 >= run.dungeon.floors.length) end(true, updated, updated.potions)
      else setView('between')
    } else if (next.over === 'lose') {
      end(false, run, next.potions)
    }
  }

  function nextFloor() {
    if (!run || !battle || !stats) return
    const floor = run.floor + 1
    const hp = Math.min(stats.maxHp, battle.playerHp + Math.round(stats.maxHp * 0.25))
    setRun({ ...run, floor })
    const next = run.tower ? towerMonster(run.tower.start + floor) : run.dungeon.floors[floor]
    setBattle(newBattle(stats, next, run.potions, hp))
    setLastLoot(null)
    setView('battle')
  }

  function retreat() {
    if (!run || !battle) return
    end(true, run, run.potions)
  }

  function giveUp() {
    if (!run || !battle) return
    if (!window.confirm('Desistir? Você perde a energia gasta e metade do ouro juntado.')) return
    end(false, run, battle.potions)
  }

  function backToLobby() {
    setView('lobby')
    setRun(null)
    setBattle(null)
    setSummary(null)
  }

  // ---------------- Resultado ----------------
  if (view === 'result' && summary) {
    return (
      <div className="p-4">
        <section className="flex flex-col items-center rounded-3xl px-4 py-8 text-center" style={darkCard}>
          <div className="text-6xl">{summary.won ? '🏆' : '💀'}</div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {summary.towerFloor !== undefined
              ? summary.won
                ? 'Você recuou com o butim!'
                : 'Você caiu na torre...'
              : summary.won
                ? 'Dungeon concluída!'
                : 'Você caiu...'}
          </div>
          <div className="mt-1 text-base text-[#b8b6d0]">{summary.dungeon.name}</div>
          <div className="mt-5 space-y-1 text-lg text-white">
            {summary.towerFloor !== undefined && (
              <div className="text-xl font-bold">
                {summary.towerFloor > 0 ? `Você chegou ao andar ${summary.towerFloor}` : 'Você caiu no primeiro andar'}
              </div>
            )}
            {summary.newRecord && <div className="text-sm text-[#fbbf24]">🏅 Novo recorde pessoal!</div>}
            <div>🪙 +{n(summary.gold)} ouro</div>
            <div className="text-sm text-[#b8b6d0]">{summary.kills} monstros derrotados</div>
            {summary.firstClear && (
              <div className="text-sm text-[#fbbf24]">Bônus da primeira vitória incluído!</div>
            )}
            {summary.dailyBonus && (
              <div className="text-sm text-[#fbbf24]">Bônus do dia: +50% de ouro!</div>
            )}
            {!summary.won && (
              <div className="text-sm text-[#b8b6d0]">Quem cai fica com metade do ouro.</div>
            )}
          </div>
        </section>
        <button
          onClick={backToLobby}
          className="mt-4 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white active:opacity-80"
        >
          Voltar ao portão
        </button>
      </div>
    )
  }

  // ---------------- Batalha ----------------
  if ((view === 'battle' || view === 'between') && run && battle && monster) {
    const total = run.dungeon.floors.length
    const floorNo = run.tower ? run.tower.start + run.floor : run.floor + 1
    return (
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-300">{run.dungeon.name}</div>
            <div className="text-xs text-slate-500">
              {run.tower ? `Andar ${floorNo}` : `Andar ${floorNo} de ${total}`}
            </div>
          </div>
          <div className="flex gap-1">
            {run.tower && (
              <span className="text-xs text-slate-400">
                🪙 {n(run.gold)} · recorde {game.towerBest}
              </span>
            )}
            {run.dungeon.floors.map((f, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${
                  i < run.floor ? 'bg-emerald-400' : i === run.floor ? 'bg-slate-50' : 'bg-slate-600'
                } ${f.boss ? 'ring-2 ring-red-400/60' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Monstro */}
        <section className="rounded-3xl px-4 pb-4 pt-3 text-center" style={darkCard}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-white">
              {monster.name}
              {monster.boss && <span className="ml-2 text-xs text-[#f87171]">CHEFE</span>}
            </span>
            <span className="text-[#b8b6d0]">
              {Math.max(0, battle.monsterHp)} / {monster.maxHp}
            </span>
          </div>
          <div className="mt-1.5">
            <Bar value={battle.monsterHp} max={monster.maxHp} color="#f87171" />
          </div>
          <div
            className="mx-auto mt-2 w-fit"
            style={{
              transform: hit.m ? 'translateX(8px) scale(0.95)' : 'none',
              filter: hit.m ? 'brightness(2)' : 'none',
              opacity: battle.monsterHp <= 0 ? 0.25 : 1,
              transition: 'transform 0.12s, filter 0.12s, opacity 0.3s',
            }}
          >
            <MonsterFigure kind={monster.kind} size={monster.boss ? 170 : 140} />
          </div>
          {battle.telegraph && !battle.over && (
            <div className="mt-1 rounded-xl bg-[#f87171]/20 py-2 text-sm font-semibold text-[#fca5a5]">
              ⚠ Golpe pesado a caminho! Defenda!
            </div>
          )}
        </section>

        {/* Você */}
        <section className="mt-3 flex items-center gap-3 rounded-3xl p-3" style={darkCard}>
          <div
            className="shrink-0"
            style={{
              transform: hit.p ? 'translateX(-6px)' : 'none',
              filter: hit.p ? 'brightness(1.8)' : 'none',
              transition: 'transform 0.12s, filter 0.12s',
            }}
          >
            <HeroFigure rankIndex={c.rankIndex} color={c.rank.color} size={72} gear={gearTiers(game)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-white">{rpg.name}</span>
              <span className="text-[#b8b6d0]">
                {Math.max(0, battle.playerHp)} / {stats.maxHp}
              </span>
            </div>
            <div className="mt-1.5">
              <Bar value={battle.playerHp} max={stats.maxHp} color="#34d399" />
            </div>
            <div className="mt-1 text-xs text-[#918fa9]">🧪 {battle.potions} poções</div>
          </div>
        </section>

        {/* Registro */}
        <ul className="my-3 space-y-0.5 px-1 text-xs text-slate-400">
          {battle.log.slice(-4).map((l, i, arr) => (
            <li key={`${battle.log.length}-${i}`} className={i === arr.length - 1 ? 'text-slate-200' : ''}>
              {l}
            </li>
          ))}
        </ul>

        {view === 'between' ? (
          <div className="rounded-2xl bg-slate-800 p-4 text-center">
            <div className="text-lg font-bold text-slate-50">Andar concluído!</div>
            {lastLoot && (
              <div className="mt-1 text-sm text-slate-300">
                🪙 +{lastLoot.gold} ouro{lastLoot.potions > 0 ? ' · 🧪 +1 poção' : ''}
              </div>
            )}
            <div className="mt-1 text-xs text-slate-500">Você recupera um pouco de vida ao descer.</div>
            <button
              onClick={nextFloor}
              className="mt-3 w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-bold text-white active:opacity-80"
            >
              Próximo andar →
            </button>
            {run.tower && (
              <button
                onClick={retreat}
                className="mt-2 w-full rounded-2xl bg-slate-700 py-3 text-base font-bold text-slate-50 active:opacity-80"
              >
                Recuar e guardar 🪙 {n(run.gold)}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => act('attack')}
                className="rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white active:opacity-80"
              >
                ⚔ Atacar
              </button>
              <button
                onClick={() => act('strong')}
                disabled={battle.strongCd > 0}
                className="rounded-2xl bg-slate-700 py-4 text-lg font-bold text-slate-50 active:opacity-80 disabled:opacity-40"
              >
                💥 Forte{battle.strongCd > 0 ? ` (${battle.strongCd})` : ''}
              </button>
              <button
                onClick={() => act('defend')}
                className="rounded-2xl bg-slate-700 py-4 text-lg font-bold text-slate-50 active:opacity-80"
              >
                🛡 Defender
              </button>
              <button
                onClick={() => act('potion')}
                disabled={battle.potions <= 0 || battle.playerHp >= stats.maxHp}
                className="rounded-2xl bg-slate-700 py-4 text-lg font-bold text-slate-50 active:opacity-80 disabled:opacity-40"
              >
                🧪 Poção
              </button>
            </div>
            <button onClick={giveUp} className="mt-3 w-full py-2 text-sm text-slate-500">
              Desistir
            </button>
          </>
        )}
      </div>
    )
  }

  // ---------------- Portão (lobby) ----------------
  return (
    <div className="p-4">
      <button
        onClick={() => navigate('/personagem')}
        className="mb-3 flex items-center gap-1 text-base text-slate-400 active:opacity-60"
      >
        <BackIcon />
        Voltar
      </button>
      <h1 className="mb-4 text-3xl font-bold text-emerald-400">Aventura</h1>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          ['⚡', 'Energia', n(energy)],
          ['🪙', 'Ouro', n(game.gold)],
          ['🧪', 'Poções', String(game.potions)],
        ].map(([icon, label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-800 py-3 text-center">
            <div className="text-xl">{icon}</div>
            <div className="text-lg font-bold text-slate-50">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Treine para ganhar energia: <b className="text-slate-200">+1 por série concluída</b> e{' '}
        <b className="text-slate-200">+3 por treino finalizado</b>.
      </p>

      <section className="flex items-center gap-4 rounded-3xl p-3" style={darkCard}>
        <HeroFigure rankIndex={c.rankIndex} color={c.rank.color} size={92} gear={gearTiers(game)} />
        <ul className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1 text-sm">
          {[
            ['❤ Vida', n(stats.maxHp)],
            ['⚔ Ataque', n(stats.atk)],
            ['🛡 Defesa', n(stats.def)],
            ['✨ Crítico', `${Math.round(stats.crit)}%`],
            ['💨 Esquiva', `${Math.round(stats.dodge)}%`],
          ].map(([label, value]) => (
            <li key={label} className="flex justify-between text-[#b8b6d0]">
              <span>{label}</span>
              <span className="font-semibold text-white">{value}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-2 text-xs text-slate-500">
        Sua força de batalha vem do seu treino: Força dá ataque, Resistência dá defesa, Disciplina dá
        crítico e esquiva, Vitalidade dá vida.
      </p>

      <button
        onClick={() => navigate('/loja')}
        className="mt-4 flex w-full items-center justify-between rounded-2xl bg-slate-800 px-4 py-3.5 text-left active:opacity-80"
      >
        <span>
          <span className="block text-lg font-bold text-slate-50">🛒 Loja</span>
          <span className="block text-sm text-slate-400">Armas, armaduras, amuletos e poções</span>
        </span>
        <span className="text-xl text-slate-400">›</span>
      </button>

      <div
        className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
          game.bonusDay === todayKey() ? 'bg-slate-800 text-slate-400' : 'bg-[#fbbf24]/15 text-[#fbbf24]'
        }`}
      >
        {game.bonusDay === todayKey()
          ? '🎁 Bônus do dia já usado. Volte amanhã!'
          : '🎁 Bônus do dia: sua primeira vitória de hoje rende +50% de ouro!'}
      </div>

      <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Portões
      </h2>
      <ul className="divide-y divide-slate-700/60">
        {DUNGEONS.map((d) => {
          const need = RANKS.findIndex((r) => r.letter === d.rankLetter)
          const locked = need > c.rankIndex
          const noEnergy = energy < d.cost
          const boss = d.floors[d.floors.length - 1]
          return (
            <li key={d.id} className="py-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-[#0e0c1f]"
                  style={{ background: RANKS[need].color }}
                >
                  {d.rankLetter}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-slate-50">{d.name}</span>
                  <span className="block text-sm text-slate-400">
                    {d.floors.length} andares · chefe: {boss.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    Concluída {game.clears[d.id] ?? 0}x · custa {d.cost} ⚡
                  </span>
                </span>
              </div>
              <button
                onClick={() => start(d)}
                disabled={locked || noEnergy}
                className="mt-3 w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-bold text-white active:opacity-80 disabled:opacity-40"
              >
                {locked ? `Requer rank ${d.rankLetter}` : noEnergy ? 'Sem energia: treine!' : 'Entrar'}
              </button>
            </li>
          )
        })}
      </ul>

      <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Torre Infinita
      </h2>
      <div className="py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #1e1b4b)' }}
          >
            🗼
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-slate-50">Sem fim, cada andar mais forte</span>
            <span className="block text-sm text-slate-400">
              Chefe a cada 10 andares · recorde: {game.towerBest > 0 ? `andar ${game.towerBest}` : 'nenhum ainda'}
            </span>
            <span className="block text-xs text-slate-500">
              Recue entre os andares para guardar todo o ouro · custa {TOWER.cost} ⚡
            </span>
          </span>
        </div>
        {towerStarts.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">Começar no andar:</span>
            {towerStarts.map((f) => (
              <button
                key={f}
                onClick={() => setTowerStart(f)}
                className={`rounded-xl px-3.5 py-2 text-sm font-semibold ${
                  towerFrom === f ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => startTower(towerFrom)}
          disabled={energy < TOWER.cost}
          className="mt-3 w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-bold text-white active:opacity-80 disabled:opacity-40"
        >
          {energy < TOWER.cost ? 'Sem energia: treine!' : `Subir a torre (andar ${towerFrom})`}
        </button>
      </div>

      <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Seu histórico
      </h2>
      <ul className="divide-y divide-slate-700/60">
        <li className="flex justify-between py-3">
          <span className="text-slate-300">Dungeons concluídas</span>
          <span className="font-semibold text-slate-50">{game.wins}</span>
        </li>
        <li className="flex justify-between py-3">
          <span className="text-slate-300">Monstros derrotados</span>
          <span className="font-semibold text-slate-50">{game.kills}</span>
        </li>
      </ul>

      {game.history.length > 0 && (
        <>
          <h2 className="mb-1 mt-6 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Últimas batalhas
          </h2>
          <ul className="divide-y divide-slate-700/60">
            {game.history.slice(0, 8).map((h) => (
              <li key={h.at} className="flex items-center gap-3 py-3">
                <span className="text-2xl">{h.won ? '🏆' : '💀'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base text-slate-50">
                    {h.dungeonId === 'T'
                      ? `Torre Infinita${h.floor ? ` · andar ${h.floor}` : ''}`
                      : (DUNGEONS.find((d) => d.id === h.dungeonId)?.name ?? 'Dungeon')}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {new Date(h.at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {h.kills} monstros
                  </span>
                </span>
                <span className="font-semibold text-slate-50">🪙 +{h.gold}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}