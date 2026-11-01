import { useLocation, useNavigate } from 'react-router-dom'

export default function ProgressTabs() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onBody = pathname.startsWith('/progresso/corpo')
  const onVolume = pathname.startsWith('/progresso/volume')

  const tabs = [
    { to: '/progresso', label: 'Exercícios', active: !onBody && !onVolume },
    { to: '/progresso/volume', label: 'Volume', active: onVolume },
    { to: '/progresso/corpo', label: 'Corpo', active: onBody },
  ]

  return (
    <div className="mb-4 flex border-b border-slate-700">
      {tabs.map((t) => (
        <button
          key={t.to}
          onClick={() => navigate(t.to)}
          className={`flex-1 py-3 text-base font-semibold ${
            t.active ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-slate-400'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}