const KEY = 'fitflow-plates'

export const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 1, 0.5]

export interface PlateConfig {
  bar: number
  plates: number[] // anilhas disponíveis (cada uma em pares)
}

export function getPlateConfig(): PlateConfig {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && typeof raw.bar === 'number' && Array.isArray(raw.plates)) {
      return { bar: raw.bar, plates: raw.plates.filter((p: unknown) => typeof p === 'number') }
    }
  } catch {
    // ignora
  }
  return { bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] }
}

export function savePlateConfig(c: PlateConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    // sem armazenamento, sem problema
  }
}

export interface PlateResult {
  perSide: number[] // anilhas de um lado, da maior para a menor
  total: number // carga total montada (barra + 2 lados)
  exact: boolean
}

// Guloso: sempre a maior anilha que ainda cabe. Funciona bem com anilhas padrão.
export function calcPlates(target: number, bar: number, available: number[]): PlateResult {
  const sorted = [...available].sort((a, b) => b - a)
  let rest = Math.max(0, (target - bar) / 2)
  const perSide: number[] = []
  for (const p of sorted) {
    while (rest + 1e-9 >= p) {
      perSide.push(p)
      rest -= p
    }
  }
  const sideSum = perSide.reduce((a, b) => a + b, 0)
  const total = Math.round((bar + sideSum * 2) * 100) / 100
  return { perSide, total, exact: Math.abs(total - target) < 0.001 }
}

// Agrupa [20,20,5] em [{plate:20,count:2},{plate:5,count:1}]
export function groupPlates(perSide: number[]): { plate: number; count: number }[] {
  const out: { plate: number; count: number }[] = []
  for (const p of perSide) {
    const last = out[out.length - 1]
    if (last && last.plate === p) last.count++
    else out.push({ plate: p, count: 1 })
  }
  return out
}