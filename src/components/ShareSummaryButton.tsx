import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { Session } from '../types'

const W = 1080
const H = 1350

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
}

function duration(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000))
  const h = Math.floor(min / 60)
  return h > 0 ? `${h}h${String(min % 60).padStart(2, '0')}` : `${min} min`
}

function summaryOf(session: Session) {
  let volume = 0
  let sets = 0
  const lines: { name: string; best: string }[] = []
  for (const ex of session.exercises) {
    const done = ex.sets.filter((s) => s.done && s.kind !== 'warmup')
    if (done.length === 0) continue
    sets += done.length
    if (ex.mode === 'time') {
      const best = Math.max(...done.map((s) => s.seconds ?? 0))
      lines.push({ name: ex.exerciseName, best: `${done.length}× · melhor ${best}s` })
      continue
    }
    for (const s of done) volume += s.weight * s.reps
    const top = done.reduce((a, b) => (b.weight * (1 + b.reps / 30) > a.weight * (1 + a.reps / 30) ? b : a))
    lines.push({
      name: ex.exerciseName,
      best: `${done.length}× · ${fmt(top.weight)} kg × ${top.reps}`,
    })
  }
  return { volume, sets, lines }
}

function drawSummary(session: Session): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#16296b')
  bg.addColorStop(1, '#070d28')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 800)
  glow.addColorStop(0, 'rgba(59,130,246,0.45)')
  glow.addColorStop(1, 'rgba(59,130,246,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const font = "'Plus Jakarta Sans Variable', system-ui, sans-serif"
  const { volume, sets, lines } = summaryOf(session)
  const date = new Date(session.startedAt).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  ctx.textAlign = 'left'
  ctx.fillStyle = '#93c5fd'
  ctx.font = `700 36px ${font}`
  ctx.fillText('FITFLOW', 80, 110)

  ctx.fillStyle = '#ffffff'
  let size = 76
  ctx.font = `800 ${size}px ${font}`
  while (ctx.measureText(session.name).width > W - 160 && size > 36) {
    size -= 2
    ctx.font = `800 ${size}px ${font}`
  }
  ctx.fillText(session.name, 80, 220)

  ctx.fillStyle = '#b4c2ee'
  ctx.font = `500 36px ${font}`
  ctx.fillText(date, 80, 280)

  // três números
  const stats = [
    { label: 'TEMPO', value: duration((session.finishedAt ?? session.startedAt) - session.startedAt) },
    { label: 'SÉRIES', value: String(sets) },
    { label: 'VOLUME', value: `${Math.round(volume).toLocaleString('pt-BR')} kg` },
  ]
  stats.forEach((s, i) => {
    const x = 80 + i * 320
    ctx.fillStyle = 'rgba(148,170,255,0.14)'
    ctx.beginPath()
    ctx.roundRect(x, 340, 290, 150, 28)
    ctx.fill()
    ctx.fillStyle = '#8497d1'
    ctx.font = `700 26px ${font}`
    ctx.fillText(s.label, x + 28, 392)
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 46px ${font}`
    ctx.fillText(s.value, x + 28, 455)
  })

  // exercícios
  ctx.fillStyle = '#93c5fd'
  ctx.font = `700 30px ${font}`
  ctx.fillText('EXERCÍCIOS', 80, 575)

  const max = 9
  const shown = lines.slice(0, max)
  shown.forEach((l, i) => {
    const y = 640 + i * 66
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 36px ${font}`
    const name = l.name.length > 24 ? l.name.slice(0, 23) + '…' : l.name
    ctx.fillText(name, 80, y)
    ctx.fillStyle = '#7dd3fc'
    ctx.font = `600 32px ${font}`
    ctx.textAlign = 'right'
    ctx.fillText(l.best, W - 80, y)
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(148,170,255,0.18)'
    ctx.fillRect(80, y + 20, W - 160, 2)
  })
  if (lines.length > max) {
    ctx.fillStyle = '#8497d1'
    ctx.font = `600 30px ${font}`
    ctx.fillText(`+ ${lines.length - max} exercícios`, 80, 640 + max * 66)
  }

  ctx.fillStyle = '#5f72b0'
  ctx.font = `600 30px ${font}`
  ctx.textAlign = 'center'
  ctx.fillText('Treino registrado no FitFlow 💪', W / 2, H - 70)
  return canvas
}

export default function ShareSummaryButton({ session }: { session: Session }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function share() {
    setBusy(true)
    setMessage('')
    try {
      // garante que a fonte do app já carregou antes de desenhar
      await document.fonts?.load("800 40px 'Plus Jakarta Sans Variable'")
      const canvas = drawSummary(session)
      const dataUrl = canvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      const fileName = `fitflow-${new Date(session.startedAt).toISOString().slice(0, 10)}.png`

      if (Capacitor.isNativePlatform()) {
        const saved = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        })
        await Share.share({ title: 'Meu treino no FitFlow', files: [saved.uri] })
      } else {
        // no navegador: baixa a imagem
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = fileName
        a.click()
        setMessage('Imagem baixada.')
      }
    } catch {
      setMessage('Não consegui compartilhar agora. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={share}
        disabled={busy}
        className="w-full rounded-xl bg-emerald-500 py-3 text-base font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Gerando imagem...' : '📤 Compartilhar resumo'}
      </button>
      {message && <p className="mt-2 text-center text-sm text-slate-300">{message}</p>}
    </div>
  )
}