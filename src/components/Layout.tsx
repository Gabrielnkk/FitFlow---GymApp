import type { ComponentType } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChatIcon,
  ClockIcon,
  DumbbellIcon,
  ListIcon,
  SlidersIcon,
  TrendIcon,
} from './Icons'
import { ForkIcon } from './NutritionIcons'
import LevelWatcher from './LevelWatcher'

type TabIcon = ComponentType<{ active?: boolean; size?: number }>

const tabs: { to: string; label: string; icon: TabIcon; end: boolean }[] = [
  { to: '/', label: 'Treinos', icon: DumbbellIcon, end: true },
  { to: '/exercicios', label: 'Exercícios', icon: ListIcon, end: false },
  { to: '/dieta', label: 'Dieta', icon: ForkIcon, end: false },
  { to: '/historico', label: 'Histórico', icon: ClockIcon, end: false },
  { to: '/progresso', label: 'Progresso', icon: TrendIcon, end: false },
  { to: '/assistente', label: 'Assistente', icon: ChatIcon, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: SlidersIcon, end: false },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col">
      <LevelWatcher />
      <main className="flex-1 overflow-y-auto pb-28">
        <div key={location.pathname} className="page-enter mx-auto max-w-md">
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-600/50 bg-slate-900"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex max-w-md">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.end}
                className="block h-full"
              >
                {({ isActive }) => {
                  const Icon = t.icon
                  return (
                    <span
                      className={`relative flex h-full w-full flex-col items-center gap-1 py-2 text-[9.5px] transition-colors ${
                        isActive ? 'font-semibold text-emerald-400' : 'font-medium text-slate-400'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-1/3 top-0 h-0.5 rounded-full bg-emerald-400"
                        />
                      )}
                      <span
                        className={`flex h-9 min-w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                          isActive
                            ? 'bg-emerald-500/15 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)]'
                            : 'scale-95'
                        }`}
                      >
                        <Icon active={isActive} size={24} />
                      </span>
                      <span>{t.label}</span>
                    </span>
                  )
                }}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}