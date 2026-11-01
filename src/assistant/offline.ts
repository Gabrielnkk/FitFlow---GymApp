import { sessionVolume } from '../db/history'
import { buildPoints, buildRecords, buildSummaries } from '../db/progress'
import { MUSCLE_GROUPS, type BodyEntry, type Exercise, type Session } from '../types'
import { BODY_FIELDS, dateToInput } from '../db/body'
import {
  bestStreak,
  daysTrainedInWeek,
  getWeeklyGoal,
  mondayOf,
  trainedDays,
  weeklyStreak,
} from '../utils/frequency'
import { formatDate, formatKg } from '../utils/format'
import { suggestProgression } from '../db/progression'
import { isWorkingSet } from '../utils/sets'

export interface AssistantData {
  exercises: Exercise[]
  sessions: Session[] // só treinos finalizados
    bodyEntries?: BodyEntry[]
}

export const SUGGESTIONS = [
  'Resumo da semana',
  'Quanto colocar no supino reto?',
  'Grupos esquecidos',
  'Meus recordes',
  'Estou estagnado?',
  'Como faço backup?',
  'O que é RPE?',
  'Meu peso',
  'Minha sequência',
]

const DAY = 24 * 60 * 60 * 1000

// minúsculas e sem acentos, para comparar textos
function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

function countSets(list: Session[]): number {
  return list.reduce((n, s) => n + s.exercises.reduce((m, e) => m + e.sets.length, 0), 0)
}

// Descobre de qual exercício a pessoa está falando
function findExercise(q: string, data: AssistantData): Exercise | null {
  const withHistory = new Set<string>()
  for (const s of data.sessions) for (const e of s.exercises) withHistory.add(e.exerciseId)

  let best: Exercise | null = null
  let bestScore = 0
  for (const ex of data.exercises) {
    const name = norm(ex.name)
    let score = 0
    if (q.includes(name)) {
      score = 100 + name.length
    } else {
      const words = name.split(/[^a-z0-9]+/).filter((w) => w.length >= 4)
      if (words.length === 0) continue
      const hits = words.filter((w) => q.includes(w)).length
      if (hits === 0) continue
      score = (hits / words.length) * 50
    }
    if (withHistory.has(ex.id)) score += 5
    if (score > bestScore) {
      bestScore = score
      best = ex
    }
  }
  return bestScore >= 15 ? best : null
}

function weeklySummary(sessions: Session[]): string {
  if (sessions.length === 0) {
    return 'Você ainda não finalizou nenhum treino. Quando finalizar, eu mostro o resumo da semana.'
  }
  const now = Date.now()
  const week = sessions.filter((s) => s.startedAt >= now - 7 * DAY)
  const prev = sessions.filter((s) => s.startedAt >= now - 14 * DAY && s.startedAt < now - 7 * DAY)
  const volume = (list: Session[]) => list.reduce((sum, s) => sum + sessionVolume(s), 0)
  const volWeek = volume(week)
  const volPrev = volume(prev)

  let text =
    `Últimos 7 dias: ${plural(week.length, 'treino', 'treinos')}, ` +
    `${plural(countSets(week), 'série', 'séries')} e ${formatKg(volWeek)} kg de volume.\n` +
    `Semana anterior: ${plural(prev.length, 'treino', 'treinos')} e ${formatKg(volPrev)} kg de volume.`

  if (week.length === 0) {
    text += '\n\nNenhum treino nos últimos 7 dias. Que tal treinar hoje?'
  } else if (volPrev > 0) {
    const pct = Math.round((volWeek / volPrev - 1) * 100)
    if (pct > 0) text += `\n\nO volume está ${pct}% maior que na semana anterior.`
    else if (pct < 0) text += `\n\nO volume está ${Math.abs(pct)}% menor que na semana anterior.`
    else text += '\n\nO volume está igual ao da semana anterior.'
  }
  return text
}

function suggestLoad(ex: Exercise, sessions: Session[]): string {
  const sug = suggestProgression(sessions, ex.id)
  if (!sug) {
    return (
      `Você ainda não tem treinos finalizados de ${ex.name}. ` +
      'Comece com uma carga leve, que deixe 2 ou 3 repetições sobrando, e registre o treino. ' +
      'Na próxima vez eu sugiro a carga.'
    )
  }

  const lastSession = sessions
    .filter((s) => s.exercises.some((e) => e.exerciseId === ex.id))
    .sort((a, b) => b.startedAt - a.startedAt)[0]
  const found = lastSession.exercises.find((e) => e.exerciseId === ex.id)
  const lastSets = (found?.sets ?? [])
    .filter(isWorkingSet)
    .map((s) => (found?.mode === 'time' ? `${s.seconds ?? 0}s` : `${formatKg(s.weight)}×${s.reps}`))
    .join(' · ')

  const value = sug.seconds !== undefined ? `${sug.seconds} s` : `${formatKg(sug.weight)} kg`
  return `${ex.name}\nÚltima vez (${formatDate(lastSession.startedAt)}): ${lastSets}\n\nSugestão: ${value}.\n${sug.reason}`
}

function forgottenGroups(data: AssistantData): string {
  if (data.sessions.length === 0) {
    return 'Ainda não há treinos finalizados para eu analisar. Finalize um treino e pergunte de novo.'
  }
  const groupOf = new Map(data.exercises.map((e) => [e.id, e.muscleGroup]))
  const lastTrained = new Map<string, number>()
  for (const s of data.sessions) {
    for (const ex of s.exercises) {
      const group = groupOf.get(ex.exerciseId)
      if (!group) continue
      if (s.startedAt > (lastTrained.get(group) ?? 0)) lastTrained.set(group, s.startedAt)
    }
  }

  const now = Date.now()
  const rows = MUSCLE_GROUPS.filter((g) => g !== 'Outro' && g !== 'Cardio').map((g) => {
    const t = lastTrained.get(g)
    return { group: g, days: t === undefined ? null : Math.floor((now - t) / DAY) }
  })
  const late = rows
    .filter((r) => r.days === null || r.days >= 7)
    .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999))

  if (late.length === 0) return 'Você treinou todos os grupos musculares nos últimos 7 dias. Bom equilíbrio!'
  return (
    'Grupos há mais tempo sem treino:\n' +
    late
      .map((r) => `• ${r.group}: ${r.days === null ? 'nunca registrado' : `${r.days} dias sem treinar`}`)
      .join('\n')
  )
}

function recordsAnswer(q: string, data: AssistantData): string {
  if (data.sessions.length === 0) return 'Ainda não há treinos finalizados, então não há recordes.'
  const ex = findExercise(q, data)
  if (ex) {
    const r = buildRecords(data.sessions, ex.id)
        if (r.maxWeight === 0 && r.bestSeconds > 0) {
      return `Melhor tempo em ${ex.name}: ${r.bestSeconds} s.`
    }
    if (r.maxWeight === 0) return `Ainda não há registros de ${ex.name}.`
    return (
      `Recordes de ${ex.name}:\n` +
      `• Maior carga: ${formatKg(r.maxWeight)} kg${r.maxWeightDate ? ` (${formatDate(r.maxWeightDate)})` : ''}\n` +
      `• Mais reps em uma série: ${r.bestReps} com ${formatKg(r.bestRepsWeight)} kg\n` +
      `• Maior volume em um treino: ${formatKg(r.bestVolume)} kg`
    )
  }
  const top = buildSummaries(data.sessions)
      .filter((s) => !s.isTime)
    .sort((a, b) => b.records.maxWeight - a.records.maxWeight)
    .slice(0, 5)
  return (
    'Suas maiores cargas:\n' +
    top.map((s) => `• ${s.name}: ${formatKg(s.records.maxWeight)} kg`).join('\n') +
    '\n\nPara ver um exercício específico, pergunte, por exemplo: "meu recorde no supino reto".'
  )
}

function stagnantAnswer(data: AssistantData): string {
  const stuck = buildSummaries(data.sessions)
    .filter((s) => s.sessions >= 3 && !s.isTime)
    .filter((s) => {
      const last3 = buildPoints(data.sessions, s.exerciseId).slice(-3)
      return last3.length === 3 && last3[2].maxWeight <= last3[0].maxWeight
    })
    .map((s) => s.name)

  if (stuck.length === 0) {
    return 'Nenhum exercício parece estagnado nas últimas 3 sessões (ou ainda há poucos treinos para comparar).'
  }
  return (
    'Sem aumento de carga nas últimas 3 sessões:\n' +
    stuck.map((n) => `• ${n}`).join('\n') +
    '\n\nIdeias: bata a meta de reps em todas as séries antes de subir, durma bem, ou troque a variação do exercício por algumas semanas.'
  )
}
 function frequencyAnswer(sessions: Session[]): string {
  if (sessions.length === 0) {
    return 'Ainda não há treinos finalizados para eu calcular a sua frequência.'
  }
  const days = trainedDays(sessions)
  const goal = getWeeklyGoal()
  const now = new Date()
  const week = daysTrainedInWeek(days, mondayOf(now))
  const monthPrefix = dateToInput(now.getTime()).slice(0, 7)
  const inMonth = [...days].filter((d) => d.startsWith(monthPrefix)).length
  const streak = weeklyStreak(days, goal, now)
  const best = bestStreak(days, goal, now)

  return (
    `Meta: ${plural(goal, 'dia', 'dias')} por semana.\n` +
    `Esta semana: ${week} de ${goal}.\n` +
    `Neste mês: ${plural(inMonth, 'dia treinado', 'dias treinados')}.\n` +
    `Sequência atual: ${plural(streak, 'semana', 'semanas')} batendo a meta.\n` +
    `Melhor sequência: ${plural(best, 'semana', 'semanas')}.\n\n` +
    'Para mudar a meta, use os botões − e + no calendário da aba Histórico.'
  )
}
function bodyAnswer(entries: BodyEntry[]): string {
  if (entries.length === 0) {
    return 'Você ainda não registrou peso nem medidas. Vá em Progresso > Corpo e toque em "+ Registrar".'
  }
  const sorted = [...entries].sort((a, b) => b.date - a.date)
  const parts: string[] = []

  const withWeight = sorted.filter((e) => e.weight !== undefined)
  if (withWeight.length > 0) {
    const latest = withWeight[0]
    const latestWeight = latest.weight ?? 0
    let text = `Peso atual: ${formatKg(latestWeight)} kg (${formatDate(latest.date)}).`
    const inWindow = withWeight.filter(
      (e) => e.id !== latest.id && e.date >= latest.date - 30 * DAY,
    )
    const ref = inWindow[inWindow.length - 1]
    if (ref) {
      const diff = latestWeight - (ref.weight ?? 0)
      text +=
        diff === 0
          ? ' Sem variação nos últimos 30 dias.'
          : ` Variação nos últimos 30 dias: ${diff > 0 ? '+' : '−'}${formatKg(Math.abs(diff))} kg.`
    }
    parts.push(text)
  }

  const others = BODY_FIELDS.filter((f) => f.key !== 'weight')
    .map((f) => {
      const entry = sorted.find((x) => x[f.key] !== undefined)
      return entry ? `• ${f.label}: ${formatKg(entry[f.key] ?? 0)} ${f.unit}` : null
    })
    .filter((line): line is string => line !== null)
  if (others.length > 0) parts.push(`Medidas mais recentes:\n${others.join('\n')}`)

  return parts.join('\n\n')
} const INTRO =
  'Posso ajudar com:\n' +
  '• Resumo da semana\n' +
  '• Quanto colocar de carga em um exercício\n' +
  '• Grupos musculares esquecidos\n' +
  '• Recordes e exercícios estagnados\n' +
  '• Dúvidas do app: backup, RPE, 1RM, timer, treinos, histórico'

const HELP: { test: RegExp; answer: string }[] = [
  {
    test: /(chave|\bapi\b|ia online)/,
        answer:
      'A IA online usa o Google Gemini e é opcional. Crie uma chave em aistudio.google.com/apikey, cole em Ajustes, no quadro "Assistente IA", e salve. Depois, aqui no topo do chat, escolha "IA online". Ela precisa de internet e tem limites de uso no plano gratuito. Sem chave, eu continuo funcionando offline.',},
  {
    test: /(\brpe\b|esforco)/,
    answer:
      'RPE é a nota de esforço da série, de 1 a 10. 10 = não dava para fazer mais nenhuma repetição, 9 = sobrava 1, 8 = sobravam 2, e assim por diante.\n\nNa sessão, cada série mostra "Auto (x)", calculado a partir do seu melhor 1RM estimado no histórico. Você pode escolher o seu valor na lista, que vale mais que o automático. O automático só aparece depois de 1 treino finalizado do exercício.',
  },
  {
    test: /(1\s?rm|epley)/,
    answer:
      '1RM é a maior carga que você levantaria 1 vez. O app estima pela fórmula de Epley: peso × (1 + reps ÷ 30), usando séries de até 12 reps. O valor aparece na aba Progresso.',
  },
  {
    test: /(backup|exportar|importar|restaurar|trocar de celular)/,
    answer:
      'Em Ajustes: "Exportar backup" gera um arquivo .json (no celular abre o compartilhar: mande para o Drive ou WhatsApp). "Importar backup" restaura e SUBSTITUI exercícios, treinos e histórico. Faça backup antes de desinstalar o app ou trocar de celular.',
  },
  {
    test: /(timer|descanso|vibra|apito|\bsom\b)/,
    answer:
      'Ao tocar ✓ numa série, começa o descanso definido no treino. Dá para ajustar −15s/+15s ou pular. No fim o app vibra e apita (confira o volume e o modo silencioso). Mantenha a tela ligada para o alerta tocar na hora certa.',
  },
  {
    test: /(duplicar|editar|excluir|apagar|deletar) (o |um |este )?treino/,
    answer:
      'Na aba Treinos, cada treino tem os botões Editar, Duplicar e Excluir. Excluir um treino não apaga o histórico. Para apagar um treino feito, abra-o no Histórico e use "Excluir treino do histórico".',
  },
  {
    test: /((criar|novo|montar|fazer) (um )?treino|rotina)/,
    answer:
      'Aba Treinos > "+ Novo treino": dê um nome, adicione exercícios e defina séries, reps e descanso de cada um. Use ↑ ↓ para mudar a ordem.',
  },
  {
    test: /(criar|novo|cadastrar|adicionar) (um )?exercicio/,
    answer:
      'Aba Exercícios > "+ Novo": informe nome, grupo muscular, equipamento e observações. Toque num exercício para editar ou excluir.',
  },
  {
    test: /(iniciar|comecar|avulso|fechou|fechar|perdi|em andamento)/,
    answer:
      'Treinos > "▶ Iniciar treino". O treino é salvo a cada toque: se o app fechar, ele volta de onde parou (aparece o aviso "Treino em andamento"). Só as séries com ✓ vão para o histórico. Para treinar sem rotina, use "Iniciar treino avulso".',
  },
  {
    test: /(historico|ultima vez|comparac)/,
    answer:
      'A aba Histórico lista seus treinos. Toque em um para ver as séries, o RPE e a comparação com a última vez de cada exercício.',
  },
  {
    test: /(grafico|progresso|evolucao)/,
    answer:
      'Na aba Progresso, escolha o exercício para ver a evolução da carga máxima ou do volume, os recordes e o 1RM estimado.',
  },
  {
    test: /(offline|internet|nuvem|desinstal|perder (os )?dados|onde (ficam|salva))/,
    answer:
      'Tudo fica só no seu celular, sem login e sem nuvem, e funciona offline. Desinstalar o app apaga tudo, então exporte um backup antes. A única parte que usa internet é a IA online do assistente, que é opcional.',
  },
]

export function answerOffline(question: string, data: AssistantData): string {
  const q = norm(question).trim()

  if (/^(oi|ola|e ai|opa|bom dia|boa tarde|boa noite)\b/.test(q)) {
    return `Oi! Sou o assistente do FitFlow.\n\n${INTRO}`
  }
  if (/\b(ajuda|help)\b|o que (voce )?(faz|sabe|pode)/.test(q)) return INTRO

  if (/(resumo|como (eu )?fui|minha semana|essa semana|esta semana|ultimos dias|desempenho)/.test(q)) {
    return weeklySummary(data.sessions)
  }

  if (/(sugest|quanto (colocar|por|usar|de peso)|qual carga|proxima carga|subir (a )?carga|aumentar (a )?carga|progressao)/.test(q)) {
    const ex = findExercise(q, data)
    if (!ex) {
      return 'De qual exercício? Pergunte, por exemplo: "quanto colocar no supino reto?".'
    }
    return suggestLoad(ex, data.sessions)
  }

  if (/(esquecid|negligenc|o que treinar|que treino fazer|falta treinar|sem treinar)/.test(q)) {
    return forgottenGroups(data)
  }

  if (/(recorde|\bprs?\b|melhor carga|maior carga)/.test(q)) return recordsAnswer(q, data)

  if (/(estagn|travad|parei de evoluir|nao (estou )?evoluindo|plato)/.test(q)) {
    return data.sessions.length === 0
      ? 'Ainda não há treinos finalizados para eu analisar.'
      : stagnantAnswer(data)
  }
  if (/(meu peso|peso corporal|minhas medidas|medidas corporais|cintura|bracos?|\bgordura\b|emagre|engord)/.test(q)) {
    return bodyAnswer(data.bodyEntries ?? [])
  }
    if (/(sequencia|frequencia|streak|quantos treinos|quantas vezes|constancia|meta semanal)/.test(q)) {
    return frequencyAnswer(data.sessions)
  }
  for (const topic of HELP) {
    if (topic.test.test(q)) return topic.answer
  }

  return `Não entendi bem essa pergunta.\n\n${INTRO}\n\nSe quiser conversar livremente, ative a IA online em Ajustes.`
}