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
  { to: '/', label: 'Treinos', icon: <DumbbellIcon />, end: true },
  { to: '/exercicios', label: 'Exercícios', icon: <ListIcon />, end: false },
  { to: '/dieta', label: 'Dieta', icon: <ForkIcon />, end: false },
  { to: '/historico', label: 'Histórico', icon: <ClockIcon />, end: false },
  { to: '/progresso', label: 'Progresso', icon: <TrendIcon />, end: false },
  { to: '/assistente', label: 'Assistente', icon: <ChatIcon />, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: <SlidersIcon />, end: false },
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
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-[9.5px] transition-colors ${
                    isActive ? 'font-semibold text-slate-50' : 'font-medium text-slate-500'
                  }`
                }
              >
                {t.icon}
                <span>{t.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}