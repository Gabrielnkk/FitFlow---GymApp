// made by: Gabriel Mattos
import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { Session } from '../types'
import Modal from './Modal'
import { isIos } from '../utils/platform'

const W = 1080
const H = 1350

// Data no fuso do aparelho (AAAA-MM-DD). toISOString usaria UTC e, depois das 21h no Brasil, trocaria o dia.
function localDay(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

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

// Transforma o desenho (canvas) em arquivo PNG
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob devolveu vazio'))), 'image/png')
  })
}

// Só usado no APK: o plugin de arquivos do Capacitor pede o conteúdo em base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler a imagem'))
    reader.readAsDataURL(file)
  })
}

interface Prepared {
  key: string // de qual sessão (e de qual tentativa) é esta imagem
  file: File
  url: string // endereço temporário da imagem, usado só para mostrar na tela
}

export default function ShareSummaryButton({ session }: { session: Session }) {
  const [attempt, setAttempt] = useState(0)
  const key = `${session.id}:${attempt}`
  const [stored, setStored] = useState<Prepared | null>(null)
  const [failedKey, setFailedKey] = useState('')
  // só vale a imagem que é desta sessão e desta tentativa
  const prepared = stored?.key === key ? stored : null
  const failed = failedKey === key
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [message, setMessage] = useState('')

  // A imagem é gerada assim que a tela abre. O iOS só deixa abrir a janela de compartilhar
  // logo depois de um toque seu; se o app desenhasse a imagem só no toque, ele podia recusar.
  useEffect(() => {
    let cancelled = false
    let url = ''
    void (async () => {
      try {
        // garante que a fonte do app já carregou antes de desenhar
        await document.fonts?.load("800 40px 'Plus Jakarta Sans Variable'")
        const blob = await canvasToBlob(drawSummary(session))
        if (cancelled) return
        const day = localDay(session.startedAt)
        const file = new File([blob], `treino-${day}.png`, { type: 'image/png' })
        url = URL.createObjectURL(blob)
        setStored({ key, file, url })
      } catch {
        if (!cancelled) setFailedKey(key)
      }
    })()
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
    // a imagem só muda se for outra sessão (ou se você tocar para tentar de novo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  async function share() {
    if (busy) return
    if (!prepared) {
      if (failed) setAttempt((a) => a + 1) // tenta gerar de novo
      return
    }
    setMessage('')
    const { file } = prepared
    const text = `Treino do dia ${new Date(session.startedAt).toLocaleDateString('pt-BR')}: ${session.name}`

    // 1) APK Android (Capacitor): janela de compartilhar do próprio Android
    if (Capacitor.isNativePlatform()) {
      setBusy(true)
      try {
        const saved = await Filesystem.writeFile({
          path: file.name,
          data: await fileToBase64(file),
          directory: Directory.Cache,
        })
        await Share.share({ title: 'Meu treino', text, files: [saved.uri] })
      } catch (err) {
        if (!(err instanceof Error && /cancel/i.test(err.message))) {
          setMessage('Não foi possível compartilhar. Tente novamente.')
        }
      } finally {
        setBusy(false)
      }
      return
    }

    // 2) Navegador / PWA do iPhone: janela nativa de compartilhar com a imagem.
    // Importante: não pode haver nenhum "await" antes do navigator.share (o iOS exige o toque recente).
    if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
      setBusy(true)
      try {
        await navigator.share({ files: [file], title: 'Meu treino', text })
      } catch (err) {
        // AbortError = você fechou a janela de compartilhar (não é erro)
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setMessage('Não foi possível compartilhar. Tente novamente.')
        }
      } finally {
        setBusy(false)
      }
      return
    }

    // 3) Sem suporte (ex.: computador): mostra a imagem na tela, sem fingir que baixou nada
    setPreview(true)
  }

  const label = busy
    ? 'Compartilhando...'
    : !prepared && !failed
      ? 'Gerando imagem...'
      : failed
        ? 'Tentar de novo'
        : '📤 Compartilhar treino'

  return (
    <div className="mb-4">
      <button
        onClick={() => void share()}
        disabled={busy || (!prepared && !failed)}
        className="w-full rounded-xl bg-emerald-500 py-3 text-base font-bold text-white disabled:opacity-60"
      >
        {label}
      </button>
      {failed && !message && (
        <p className="mt-2 text-center text-sm text-slate-300">Não foi possível gerar a imagem.</p>
      )}
      {message && <p className="mt-2 text-center text-sm text-slate-300">{message}</p>}

      {preview && prepared && (
        <Modal title="Resumo do treino" onClose={() => setPreview(false)}>
          <img src={prepared.url} alt="Resumo do treino" className="mx-auto mb-3 w-full rounded-xl" />
          {isIos() ? (
            <p className="text-center text-sm text-slate-300">Toque e segure na imagem para salvar em Fotos.</p>
          ) : (
            <>
              <p className="mb-3 text-center text-sm text-slate-300">
                Este navegador não abre a janela de compartilhar. Baixe a imagem abaixo.
              </p>
              <a
                href={prepared.url}
                download={prepared.file.name}
                className="block rounded-xl bg-slate-700 py-3 text-center text-base font-bold text-white"
              >
                Baixar imagem
              </a>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
