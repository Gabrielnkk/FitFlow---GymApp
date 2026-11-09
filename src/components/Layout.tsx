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

const tabs = [
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
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-600/50 bg-slate-900"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex max-w-md">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <li key={t.to} className="flex-1">
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center gap-1 py-2.5 text-[9.5px] transition-all duration-200 ${
                      isActive
                        ? 'font-semibold text-emerald-400'
                        : 'font-medium text-slate-500 hover:text-slate-300'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon active={isActive} />
                      <span>{t.label}</span>
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-emerald-400 transition-all duration-200 ${
                          isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}