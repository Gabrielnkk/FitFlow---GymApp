import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/SettingsIcons'
import { useGame } from '../hooks/useGame'
import { MAX_POTIONS, ensureGame } from '../utils/gameState'
import { useEffect } from 'react'
import {
  ITEMS,
  POTION_PRICE,
  SLOTS,
  bonusText,
  buyItem,
  buyPotion,
  equipItem,
} from '../utils/shop'

const n = (v: number) => v.toLocaleString('pt-BR')

export default function ShopPage() {
  const navigate = useNavigate()
  const game = useGame()

  useEffect(() => {
    ensureGame()
  }, [])

  if (!game) return <div className="p-4 text-slate-400">Carregando...</div>

  return (
    <div className="p-4">
      <button
        onClick={() => navigate('/aventura')}
        className="mb-3 flex items-center gap-1 text-base text-slate-400 active:opacity-60"
      >
        <BackIcon />
        Voltar
      </button>
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-3xl font-bold text-emerald-400">Loja</h1>
        <div className="text-xl font-bold text-slate-50">🪙 {n(game.gold)}</div>
      </div>

      <h2 className="mb-1 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Poções
      </h2>
      <div className="flex items-center gap-3 py-3">
        <span className="text-3xl">🧪</span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-slate-50">Poção de Vida</span>
          <span className="block text-sm text-slate-400">
            Cura 50% da vida · você tem {game.potions}/{MAX_POTIONS}
          </span>
        </span>
        <button
          onClick={() => buyPotion(game)}
          disabled={game.gold < POTION_PRICE || game.potions >= MAX_POTIONS}
          className="rounded-xl bg-emerald-500 px-4 py-2.5 font-bold text-white active:opacity-80 disabled:opacity-40"
        >
          🪙 {POTION_PRICE}
        </button>
      </div>

      {SLOTS.map((slot) => (
        <section key={slot.id}>
          <h2 className="mb-1 mt-5 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {slot.label}
          </h2>
          <ul className="divide-y divide-slate-700/60">
            {ITEMS.filter((i) => i.slot === slot.id).map((it) => {
              const owned = game.owned.includes(it.id)
              const equipped = game.equipped[it.slot] === it.id
              return (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  <span className="text-3xl">{it.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-slate-50">{it.name}</span>
                    <span className="block text-sm text-slate-400">{bonusText(it.bonus)}</span>
                  </span>
                  {equipped ? (
                    <span className="rounded-xl border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-400">
                      Equipado
                    </span>
                  ) : owned ? (
                    <button
                      onClick={() => equipItem(game, it.id)}
                      className="rounded-xl bg-slate-700 px-4 py-2.5 font-bold text-slate-50 active:opacity-80"
                    >
                      Equipar
                    </button>
                  ) : (
                    <button
                      onClick={() => buyItem(game, it.id)}
                      disabled={game.gold < it.price}
                      className="rounded-xl bg-emerald-500 px-4 py-2.5 font-bold text-white active:opacity-80 disabled:opacity-40"
                    >
                      🪙 {n(it.price)}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}