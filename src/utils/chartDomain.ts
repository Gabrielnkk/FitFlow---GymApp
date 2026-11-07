// made by: Gabriel Mattos

export type DomainKind = 'kg' | 'relative'

/**
 * Faixa do eixo Y do gráfico, calculada pelos seus dados (em vez de sempre começar do zero).
 * - 'kg' (carga): do menor valor − 5 kg ao maior + 5 kg, arredondado de 5 em 5 para a escala ficar limpa.
 * - 'relative' (volume, tempo): folga de 10% da variação (ou 5% do valor, se for tudo igual).
 * Nunca desce abaixo de zero.
 */
export function paddedDomain(kind: DomainKind, [min, max]: readonly [number, number]): [number, number] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  if (kind === 'kg') {
    return [Math.max(0, Math.floor((min - 5) / 5) * 5), Math.ceil((max + 5) / 5) * 5]
  }
  const pad = Math.max((max - min) * 0.1, max * 0.05, 1)
  return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)]
}
