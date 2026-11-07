// made by: Gabriel Mattos
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '../db/database'
import { buildBackup, parseBackup } from '../db/backup'
import { safeRestore } from '../db/safeRestore'
import { useSaveFile } from '../hooks/useSaveFile'
import AssistantSettings from '../components/AssistantSettings'
import ProgressionSettings from '../components/ProgressionSettings'
import RestAlertSettings from '../components/RestAlertSettings'
import BackupTools from '../components/BackupTools'
import { openTutorial } from '../utils/tutorial'
import ReminderSettings from '../components/ReminderSettings'
import ThemeSettings from '../components/ThemeSettings'
import {
  BackIcon,
  BellIcon,
  CalculatorIcon,
  CalendarIcon,
  ChevronIcon,
  DatabaseIcon,
  GrowthIcon,
  HelpIcon,
  PlateIcon,
  SparkIcon,
  ThemeIcon,
  TimerIcon,
} from '../components/SettingsIcons'
import { buildExtras, readExtras } from '../db/extras'
function todayStamp(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Uma linha do menu: ícone, texto e seta. */
function Row({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-1 py-4 text-left active:opacity-60"
    >
      <span className="shrink-0 text-slate-200">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-medium">{label}</span>
        {hint && <span className="block text-sm text-slate-400">{hint}</span>}
      </span>
      <span className="shrink-0 text-slate-500">
        <ChevronIcon />
      </span>
    </button>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-1 mt-6 border-b border-slate-600/60 pb-2 text-lg font-semibold text-slate-200">
      {children}
    </h2>
  )
}

/** Moldura das telas internas: seta de voltar e título. */
function SubPage({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="p-4">
      <div className="relative mb-4 flex items-center justify-center">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 rounded-full p-1 text-slate-300"
          aria-label="Voltar"
        >
          <BackIcon />
        </button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {children}
    </div>
  )
}

function BackupScreen() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const { save, dialog } = useSaveFile(() =>
    setMessage({ type: 'ok', text: 'Backup salvo com sucesso.' }),
  )

  const counts = useLiveQuery(async () => ({
    exercises: await db.exercises.count(),
    workouts: await db.workouts.count(),
    sessions: await db.sessions.where('status').equals('finished').count(),
  }))

  async function handleExport() {
    setBusy(true)
    setMessage(null)
    try {
            const backup = await buildBackup()
      const extras = await buildExtras()
      const result = await save(
        `fitflow-backup-${todayStamp()}.json`,
        JSON.stringify(Object.assign({}, backup, { extras }), null, 2),
      )
      if (result === 'saved') setMessage({ type: 'ok', text: 'Backup salvo com sucesso.' })
      else if (result === 'pending')
        setMessage({ type: 'ok', text: 'Backup pronto. Toque em "Salvar arquivo" para escolher onde guardar.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Não foi possível exportar: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo arquivo de novo depois
    if (!file) return

    setBusy(true)
    setMessage(null)
    try {
           const text = await file.text()
      const backup = parseBackup(text)
      const extras = readExtras(text)
       const ok = window.confirm(
        `Importar este backup?\n\n` +
          `${backup.exercises.length} exercícios, ${backup.workouts.length} treinos e ` +
          `${backup.sessions.length} sessões.\n\n` +
          `ATENÇÃO: os dados atuais (exercícios, treinos e histórico) serão SUBSTITUÍDOS.\n` +
          `Uma cópia temporária é feita antes; se algo falhar, seus dados voltam como estavam.`,
      )
      if (!ok) return
      const outcome = await safeRestore(backup, extras)
      if (!outcome.ok) {
        // nem a devolução funcionou: oferece a cópia de segurança como arquivo
        let extra = ''
        if (outcome.safetyCopy) {
          const r = await save(`fitflow-copia-seguranca-${todayStamp()}.json`, outcome.safetyCopy)
          if (r === 'pending') extra = ' Toque em "Salvar arquivo" para guardar a cópia de segurança.'
          else if (r === 'saved') extra = ' A cópia de segurança foi salva em arquivo.'
        }
        setMessage({ type: 'error', text: outcome.error + extra })
        return
      }
      const { result, foodCount } = outcome
      setMessage({
        type: 'ok',
        text:
          `Importado: ${result.exercises} exercícios, ${result.workouts} treinos e ${result.sessions} sessões.` +
          (foodCount !== null
            ? ` Dieta, dias da semana e personagem também foram restaurados (${foodCount} alimentos).`
            : ''),
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Não foi possível importar o arquivo.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <BackupTools />

      <section className="mb-4 rounded-xl bg-slate-800 p-4">
        <h2 className="mb-2 text-xl font-bold">Seus dados</h2>
        {counts ? (
          <ul className="space-y-1 text-slate-300">
            <li>📚 {counts.exercises} exercícios</li>
            <li>🏋️ {counts.workouts} treinos</li>
            <li>🕒 {counts.sessions} sessões no histórico</li>
          </ul>
        ) : (
          <p className="text-slate-400">Carregando...</p>
        )}
        <p className="mt-3 text-sm text-slate-400">
          Tudo fica guardado só neste aparelho. Faça backup de vez em quando, principalmente antes
          de desinstalar o app ou trocar de celular.
        </p>
      </section>

      <section className="mb-4 rounded-xl bg-slate-800 p-4">
        <h2 className="mb-1 text-xl font-bold">Backup</h2>
        <p className="mb-4 text-sm text-slate-400">
          O arquivo de backup guarda exercícios, treinos e histórico.
        </p>

        <button
          onClick={handleExport}
          disabled={busy}
          className="mb-3 w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white active:opacity-90 disabled:opacity-50"
        >
          ⬆ Exportar backup
        </button>

        <button
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="w-full rounded-xl bg-slate-700 py-4 text-lg font-bold active:opacity-80 disabled:opacity-50"
        >
          ⬇ Importar backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFile}
        />

        {message && (
          <p
            className={`mt-4 rounded-lg p-3 text-center font-semibold ${
              message.type === 'ok'
                ? 'bg-emerald-900/40 text-emerald-300'
                : 'bg-red-900/40 text-red-300'
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      {dialog}
    </>
  )
}

const SCREENS: Record<string, { title: string; render: () => ReactNode }> = {
  backup: { title: 'Dados e backup', render: () => <BackupScreen /> },
  descanso: { title: 'Alerta de descanso', render: () => <RestAlertSettings /> },
  lembrete: { title: 'Lembrete de treino', render: () => <ReminderSettings /> },
  progressao: { title: 'Progressão automática', render: () => <ProgressionSettings /> },
  aparencia: { title: 'Aparência', render: () => <ThemeSettings /> },
  assistente: { title: 'Assistente IA', render: () => <AssistantSettings /> },
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const section = params.get('s') ?? ''
  const screen = SCREENS[section]

  if (screen) {
    return <SubPage title={screen.title}>{screen.render()}</SubPage>
  }

  const open = (key: string) => setParams({ s: key })

  return (
    <div className="p-4">
      <h1 className="mb-2 text-3xl font-bold">Ajustes</h1>

      <SectionTitle>Treino</SectionTitle>
      <Row icon={<TimerIcon />} label="Alerta de descanso" onClick={() => open('descanso')} />
      <Row icon={<BellIcon />} label="Lembrete de treino" onClick={() => open('lembrete')} />
      <Row icon={<GrowthIcon />} label="Progressão automática" onClick={() => open('progressao')} />
      <Row icon={<CalendarIcon />} label="Treino semanal sugerido" onClick={() => navigate('/plano')} />

      <SectionTitle>Ferramentas</SectionTitle>
      <Row icon={<PlateIcon />} label="Calculadora de anilhas" onClick={() => navigate('/anilhas')} />
      <Row
        icon={<CalculatorIcon />}
        label="Calculadoras"
        hint="1RM, água, IMC e gordura corporal"
        onClick={() => navigate('/calculadoras')}
      />

      <SectionTitle>Preferências</SectionTitle>
      <Row icon={<ThemeIcon />} label="Aparência" hint="Escuro, claro ou automático" onClick={() => open('aparencia')} />
      <Row icon={<SparkIcon />} label="Assistente IA" hint="Chave do Gemini" onClick={() => open('assistente')} />

      <SectionTitle>Dados</SectionTitle>
      <Row icon={<DatabaseIcon />} label="Dados e backup" hint="Exportar, importar e CSV" onClick={() => open('backup')} />

      <SectionTitle>Recursos</SectionTitle>
      <Row icon={<HelpIcon />} label="Rever tutorial" onClick={openTutorial} />

<SectionTitle>Sobre</SectionTitle>
<div className="rounded-2xl border border-[#2b3672] p-4 text-center text-sm text-slate-400">
  <p className="text-base font-bold text-slate-200">FitFlow</p>
  <p className="mt-1">Criado por Gabriel Mattos</p>
  <p>com a ajuda do Claude (Anthropic)</p>
  <p className="mt-2 text-xs text-slate-500">Fotos dos exercícios: free-exercise-db (domínio público)</p>
</div>

<p className="mt-8 text-center text-sm text-slate-500">FitFlow · funciona 100% offline</p>
    </div>
  )
}