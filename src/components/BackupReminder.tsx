import { useState } from 'react'
import { Link } from 'react-router-dom'
import { shouldRemindBackup, snoozeBackupReminder } from '../utils/backupReminder'

export default function BackupReminder() {
  const [show, setShow] = useState(shouldRemindBackup)
  if (!show) return null
  return (
    <div className="mb-4 rounded-xl border border-amber-500 bg-slate-800 p-3 text-sm">
      <div className="mb-2 text-slate-200">
        Faz tempo que você não faz backup. Exporte um para não perder seus treinos.
      </div>
      <div className="flex gap-2">
        <Link to="/ajustes" className="rounded-lg bg-emerald-500 px-4 py-2 font-bold">
          Fazer backup
        </Link>
        <button
          onClick={() => {
            snoozeBackupReminder()
            setShow(false)
          }}
          className="rounded-lg bg-slate-700 px-4 py-2"
        >
          Depois
        </button>
      </div>
    </div>
  )
}