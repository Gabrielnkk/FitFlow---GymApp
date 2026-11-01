// Animações simples de "como fazer": um boneco de palitos que alterna entre duas poses.
// Os ângulos são em graus: 0 = apontando para baixo, 90 = para a frente (direita),
// 180 = para cima, -90 = para trás.

export interface Pose {
  /** onde o boneco é "preso": no pé, no quadril ou na mão */
  anchor: 'foot' | 'hip' | 'wrist'
  x: number
  y?: number // usado quando o anchor é hip ou wrist
  lift?: number // só para anchor foot: quanto o pé sobe do chão
  torso: number
  arm: [number, number] // braço, antebraço
  arm2?: [number, number]
  leg: [number, number] // coxa, canela
  leg2?: [number, number]
  shrug?: number // sobe os ombros
}

export type Shape =
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number }

export type Prop = 'hands' | 'neck' | 'hip' | 'cable' | 'none'

export interface Pattern {
  id: string
  poses: [Pose, Pose]
  prop: Prop
  scene: Shape[]
  steps: string[]
  tip: string
}

const FLOOR = 94
const floor: Shape = { t: 'line', x1: 4, y1: FLOOR, x2: 96, y2: FLOOR }

const stand = { anchor: 'foot' as const, x: 45, torso: 180, arm: [0, 0] as [number, number], leg: [0, 0] as [number, number] }

export const PATTERNS: Record<string, Pattern> = {
  curl: {
    id: 'curl',
    prop: 'hands',
    scene: [floor],
    poses: [
      { ...stand, arm: [8, 8] },
      { ...stand, arm: [8, 150] },
    ],
    steps: [
      'Em pé, cotovelos colados ao corpo e palmas para a frente.',
      'Dobre os cotovelos e leve o peso até a altura dos ombros, sem balançar o tronco.',
      'Desça devagar, em 2 a 3 segundos, até esticar quase todo o braço.',
    ],
    tip: 'Se o corpo balança para subir o peso, a carga está alta demais.',
  },
  pushdown: {
    id: 'pushdown',
    prop: 'cable',
    scene: [floor],
    poses: [
      { ...stand, torso: 175, arm: [10, 100] },
      { ...stand, torso: 175, arm: [10, 8] },
    ],
    steps: [
      'Em pé de frente para a polia alta, cotovelos presos ao lado do corpo.',
      'Estique os cotovelos para baixo até o braço ficar reto, apertando o tríceps.',
      'Volte devagar até o antebraço ficar na altura do peito.',
    ],
    tip: 'Só o antebraço se move. Os cotovelos ficam parados.',
  },
  overhead: {
    id: 'overhead',
    prop: 'hands',
    scene: [floor],
    poses: [
      { ...stand, arm: [180, -60] },
      { ...stand, arm: [180, 180] },
    ],
    steps: [
      'Segure o peso acima da cabeça, com os cotovelos apontando para cima.',
      'Dobre os cotovelos e leve o peso para trás da cabeça.',
      'Estique os braços de novo, sem abrir os cotovelos para os lados.',
    ],
    tip: 'Contraia o abdômen para não arquear as costas.',
  },
  shoulder_press: {
    id: 'shoulder_press',
    prop: 'hands',
    scene: [floor],
    poses: [
      { ...stand, arm: [90, 180] },
      { ...stand, arm: [180, 180] },
    ],
    steps: [
      'Peso na altura dos ombros, antebraços na vertical.',
      'Empurre para cima até esticar os braços, sem travar os cotovelos com força.',
      'Desça controlando até a altura das orelhas.',
    ],
    tip: 'Mantenha as costelas fechadas: não deixe a lombar arquear.',
  },
  raise: {
    id: 'raise',
    prop: 'hands',
    scene: [floor],
    poses: [
      { ...stand, arm: [8, 8] },
      { ...stand, arm: [90, 90] },
    ],
    steps: [
      'Em pé, braços ao lado do corpo, cotovelos levemente dobrados.',
      'Levante os braços até a altura dos ombros, sem passar disso.',
      'Desça devagar, sem deixar o peso "cair".',
    ],
    tip: 'Use pouca carga e suba sem impulso: o ombro é um músculo pequeno.',
  },
  squat: {
    id: 'squat',
    prop: 'neck',
    scene: [floor],
    poses: [
      { ...stand, x: 40 },
      { ...stand, x: 40, torso: 145, leg: [75, -25] },
    ],
    steps: [
      'Pés na largura dos ombros, barra apoiada nas costas, olhar para a frente.',
      'Desça jogando o quadril para trás e dobrando os joelhos até as coxas ficarem paralelas ao chão.',
      'Empurre o chão com os pés para subir, mantendo as costas retas.',
    ],
    tip: 'Os joelhos acompanham a direção dos pés e não "entram" para dentro.',
  },
  lunge: {
    id: 'lunge',
    prop: 'none',
    scene: [floor],
    poses: [
      { anchor: 'foot', x: 62, torso: 180, arm: [0, 0], leg: [25, -20], leg2: [-30, -20] },
      { anchor: 'foot', x: 62, torso: 180, arm: [0, 0], leg: [80, -10], leg2: [-60, -100] },
    ],
    steps: [
      'Dê um passo largo à frente e mantenha o tronco reto.',
      'Desça até o joelho de trás quase tocar o chão e o da frente formar cerca de 90°.',
      'Empurre com o pé da frente para voltar. Depois troque a perna.',
    ],
    tip: 'O joelho da frente não passa muito da ponta do pé.',
  },
  deadlift: {
    id: 'deadlift',
    prop: 'hands',
    scene: [floor],
    poses: [
      { ...stand, arm: [5, 5] },
      { ...stand, torso: 100, arm: [5, 5], leg: [20, -5] },
    ],
    steps: [
      'Em pé, barra rente às pernas, joelhos levemente dobrados.',
      'Leve o quadril para trás e desça a barra deslizando pelas coxas, com as costas retas.',
      'Quando sentir o posterior da coxa esticar, suba empurrando o quadril para a frente.',
    ],
    tip: 'Nunca arredonde as costas. Se arredondar, reduza o peso ou a amplitude.',
  },
  hip_thrust: {
    id: 'hip_thrust',
    prop: 'hip',
    scene: [floor, { t: 'rect', x: 12, y: 80, w: 20, h: 14 }],
    poses: [
      { anchor: 'foot', x: 62, torso: -80, arm: [0, 0], leg: [130, -20] },
      { anchor: 'foot', x: 62, torso: -67, arm: [0, 0], leg: [85, 0] },
    ],
    steps: [
      'Costas apoiadas no banco, pés firmes no chão e a barra sobre o quadril.',
      'Empurre o quadril para cima até o corpo formar uma linha reta dos ombros aos joelhos.',
      'Aperte o glúteo por 1 segundo no alto e desça devagar.',
    ],
    tip: 'Queixo próximo ao peito: olhe para a frente, não para o teto.',
  },
  bench: {
    id: 'bench',
    prop: 'hands',
    scene: [floor, { t: 'rect', x: 22, y: 75, w: 52, h: 5 }],
    poses: [
      { anchor: 'hip', x: 62, y: 70, torso: -90, arm: [100, 180], leg: [60, -10] },
      { anchor: 'hip', x: 62, y: 70, torso: -90, arm: [180, 180], leg: [60, -10] },
    ],
    steps: [
      'Deitado no banco, pés firmes no chão e barra na altura do peito.',
      'Empurre para cima até esticar os braços, sem tirar as costas do banco.',
      'Desça controlando até a barra quase tocar o peito.',
    ],
    tip: 'Ombros "puxados" para trás e para baixo, apoiados no banco.',
  },
  incline: {
    id: 'incline',
    prop: 'hands',
    scene: [floor, { t: 'line', x1: 20, y1: 64, x2: 60, y2: 82 }],
    poses: [
      { anchor: 'hip', x: 64, y: 78, torso: -120, arm: [110, 150], leg: [60, -10] },
      { anchor: 'hip', x: 64, y: 78, torso: -120, arm: [160, 160], leg: [60, -10] },
    ],
    steps: [
      'No banco inclinado, pés firmes no chão e peso na altura da parte alta do peito.',
      'Empurre para cima e um pouco para trás até esticar os braços.',
      'Desça devagar, mantendo os cotovelos levemente abertos.',
    ],
    tip: 'Inclinação entre 30° e 45° trabalha melhor o peito. Mais que isso vira ombro.',
  },
  fly: {
    id: 'fly',
    prop: 'hands',
    scene: [floor, { t: 'rect', x: 22, y: 75, w: 52, h: 5 }],
    poses: [
      { anchor: 'hip', x: 62, y: 70, torso: -90, arm: [180, 180], leg: [60, -10] },
      { anchor: 'hip', x: 62, y: 70, torso: -90, arm: [-100, -110], leg: [60, -10] },
    ],
    steps: [
      'Deitado, braços esticados sobre o peito, cotovelos levemente dobrados.',
      'Abra os braços em arco até sentir o peito alongar, sem descer abaixo do nível do banco.',
      'Feche o arco como se abraçasse uma árvore, apertando o peito.',
    ],
    tip: 'Mantenha o mesmo ângulo nos cotovelos o tempo todo.',
  },
  pushup: {
    id: 'pushup',
    prop: 'none',
    scene: [floor],
    poses: [
      { anchor: 'foot', x: 88, torso: -120, arm: [0, 0], leg: [60, 60] },
      { anchor: 'foot', x: 88, torso: -100, arm: [60, -76], leg: [80, 80] },
    ],
    steps: [
      'Mãos no chão na largura dos ombros, corpo reto da cabeça aos pés.',
      'Dobre os cotovelos até o peito chegar perto do chão.',
      'Empurre o chão para voltar, sem deixar o quadril cair.',
    ],
    tip: 'Fica difícil? Apoie os joelhos no chão, mas mantenha o corpo reto.',
  },
  pulldown: {
    id: 'pulldown',
    prop: 'cable',
    scene: [floor, { t: 'rect', x: 30, y: 80, w: 30, h: 4 }],
    poses: [
      { anchor: 'hip', x: 45, y: 78, torso: 180, arm: [180, 180], leg: [90, 0] },
      { anchor: 'hip', x: 45, y: 78, torso: 186, arm: [-15, 160], leg: [90, 0] },
    ],
    steps: [
      'Sentado, segure a barra com os braços esticados para cima e peito aberto.',
      'Puxe a barra até a altura do queixo, levando os cotovelos para baixo e para trás.',
      'Volte devagar até esticar os braços, sentindo as costas alongarem.',
    ],
    tip: 'Pense em puxar com os cotovelos, não com as mãos.',
  },
  row: {
    id: 'row',
    prop: 'hands',
    scene: [floor, { t: 'rect', x: 20, y: 80, w: 24, h: 4 }],
    poses: [
      { anchor: 'hip', x: 35, y: 78, torso: 180, arm: [90, 90], leg: [90, 90] },
      { anchor: 'hip', x: 35, y: 78, torso: 176, arm: [-20, 80], leg: [90, 90] },
    ],
    steps: [
      'Sentado com o peito aberto, braços esticados à frente segurando a pegada.',
      'Puxe até a pegada encostar no abdômen, juntando as escápulas.',
      'Volte devagar sem curvar as costas para a frente.',
    ],
    tip: 'Ombros longe das orelhas durante o movimento todo.',
  },
  pullup: {
    id: 'pullup',
    prop: 'none',
    scene: [{ t: 'line', x1: 30, y1: 10, x2: 70, y2: 10 }],
    poses: [
      { anchor: 'wrist', x: 50, y: 10, torso: 180, arm: [180, 180], leg: [0, 0] },
      { anchor: 'wrist', x: 50, y: 10, torso: 180, arm: [60, -150], leg: [-10, -35] },
    ],
    steps: [
      'Pendurado na barra, braços esticados e ombros "ativos" (longe das orelhas).',
      'Puxe o corpo até o queixo passar da barra, levando os cotovelos para baixo.',
      'Desça devagar até esticar os braços.',
    ],
    tip: 'Sem impulso com as pernas. Se for difícil, use a máquina assistida.',
  },
  leg_extension: {
    id: 'leg_extension',
    prop: 'none',
    scene: [floor, { t: 'rect', x: 22, y: 66, w: 26, h: 4 }, { t: 'line', x1: 30, y1: 40, x2: 30, y2: 66 }],
    poses: [
      { anchor: 'hip', x: 38, y: 62, torso: 180, arm: [20, 40], leg: [90, 0] },
      { anchor: 'hip', x: 38, y: 62, torso: 180, arm: [20, 40], leg: [90, 90] },
    ],
    steps: [
      'Sentado com as costas apoiadas e o rolo logo acima dos tornozelos.',
      'Estique os joelhos até as pernas ficarem retas, apertando a frente da coxa.',
      'Desça devagar, sem deixar o peso bater.',
    ],
    tip: 'Pare 1 segundo no alto. Não trave o joelho com força.',
  },
  leg_curl: {
    id: 'leg_curl',
    prop: 'none',
    scene: [floor, { t: 'rect', x: 20, y: 80, w: 56, h: 5 }],
    poses: [
      { anchor: 'hip', x: 56, y: 76, torso: -90, arm: [-80, -80], leg: [90, 90] },
      { anchor: 'hip', x: 56, y: 76, torso: -90, arm: [-80, -80], leg: [90, 200] },
    ],
    steps: [
      'Deitado de barriga para baixo, rolo na parte de trás dos tornozelos.',
      'Dobre os joelhos levando os calcanhares em direção ao glúteo.',
      'Volte devagar até esticar quase toda a perna.',
    ],
    tip: 'Mantenha o quadril colado no banco. Se ele sobe, reduza a carga.',
  },
  crunch: {
    id: 'crunch',
    prop: 'none',
    scene: [floor],
    poses: [
      { anchor: 'hip', x: 62, y: 89, torso: -90, arm: [-70, -140], leg: [55, -20] },
      { anchor: 'hip', x: 62, y: 89, torso: -135, arm: [-110, -170], leg: [55, -20] },
    ],
    steps: [
      'Deitado, joelhos dobrados e mãos leves atrás da cabeça.',
      'Contraia o abdômen e levante só os ombros do chão, expirando.',
      'Volte devagar sem relaxar totalmente a barriga.',
    ],
    tip: 'Não puxe o pescoço com as mãos: o movimento vem do abdômen.',
  },
  leg_raise: {
    id: 'leg_raise',
    prop: 'none',
    scene: [floor],
    poses: [
      { anchor: 'hip', x: 54, y: 89, torso: -90, arm: [80, 80], leg: [95, 95] },
      { anchor: 'hip', x: 54, y: 89, torso: -90, arm: [80, 80], leg: [175, 175] },
    ],
    steps: [
      'Deitado, lombar encostada no chão e pernas esticadas.',
      'Suba as pernas juntas até ficarem na vertical.',
      'Desça devagar, parando antes de o pé tocar o chão.',
    ],
    tip: 'Se a lombar descolar do chão, dobre um pouco os joelhos.',
  },
  plank: {
    id: 'plank',
    prop: 'none',
    scene: [floor],
    poses: [
      { anchor: 'hip', x: 55, y: 86, torso: -105, arm: [0, 90], leg: [75, 75] },
      { anchor: 'hip', x: 55, y: 85, torso: -106, arm: [0, 90], leg: [75, 75] },
    ],
    steps: [
      'Apoie os antebraços no chão, cotovelos embaixo dos ombros.',
      'Forme uma linha reta da cabeça aos calcanhares e contraia abdômen e glúteos.',
      'Respire normalmente e segure pelo tempo da meta.',
    ],
    tip: 'Quadril alto demais ou baixo demais tira o efeito: olhe de lado no espelho.',
  },
  calf_raise: {
    id: 'calf_raise',
    prop: 'none',
    scene: [floor],
    poses: [
      { ...stand, arm: [8, 8], lift: 0 },
      { ...stand, arm: [8, 8], lift: 6 },
    ],
    steps: [
      'Em pé, ponta dos pés apoiada e calcanhares livres.',
      'Suba o máximo que conseguir na ponta dos pés e segure 1 segundo.',
      'Desça devagar até alongar bem a panturrilha.',
    ],
    tip: 'Amplitude completa vale mais do que carga alta.',
  },
  shrug: {
    id: 'shrug',
    prop: 'hands',
    scene: [floor],
    poses: [
      { ...stand, arm: [6, 6], shrug: 0 },
      { ...stand, arm: [6, 6], shrug: 4 },
    ],
    steps: [
      'Em pé, segure o peso com os braços esticados ao lado do corpo.',
      'Suba os ombros em direção às orelhas, sem dobrar os cotovelos.',
      'Segure 1 segundo e desça devagar.',
    ],
    tip: 'Não gire os ombros: é só para cima e para baixo.',
  },
  run: {
    id: 'run',
    prop: 'none',
    scene: [{ t: 'line', x1: 4, y1: FLOOR, x2: 96, y2: FLOOR }],
    poses: [
      { anchor: 'hip', x: 45, y: 58, torso: 172, arm: [-40, 60], arm2: [40, 70], leg: [40, -30], leg2: [-30, -40] },
      { anchor: 'hip', x: 45, y: 58, torso: 172, arm: [40, 70], arm2: [-40, 60], leg: [-30, -40], leg2: [40, -30] },
    ],
    steps: [
      'Postura alta, olhar à frente e ombros relaxados.',
      'Passos curtos e leves, braços dobrados balançando junto ao corpo.',
      'Ajuste a velocidade para conseguir respirar de forma constante.',
    ],
    tip: 'Comece devagar nos 3 primeiros minutos para aquecer.',
  },
  cycle: {
    id: 'cycle',
    prop: 'none',
    scene: [floor, { t: 'rect', x: 28, y: 66, w: 14, h: 3 }, { t: 'line', x1: 66, y1: 94, x2: 66, y2: 48 }],
    poses: [
      { anchor: 'hip', x: 36, y: 62, torso: 150, arm: [100, 110], leg: [70, -5], leg2: [105, 40] },
      { anchor: 'hip', x: 36, y: 62, torso: 150, arm: [100, 110], leg: [105, 40], leg2: [70, -5] },
    ],
    steps: [
      'Ajuste o banco: com o pedal embaixo, o joelho fica levemente dobrado.',
      'Pedale de forma redonda e constante, sem balançar o quadril.',
      'Mantenha a resistência que permita conversar sem ficar sem ar.',
    ],
    tip: 'Mãos leves no guidão, costas retas.',
  },
  generic: {
    id: 'generic',
    prop: 'none',
    scene: [floor],
    poses: [
      { ...stand, arm: [12, 12] },
      { ...stand, arm: [170, 170] },
    ],
    steps: [
      'Posicione o corpo com a coluna neutra e o abdômen firme.',
      'Faça o movimento de forma lenta e controlada, sem impulso.',
      'Volte à posição inicial devagar e respire de forma constante.',
    ],
    tip: 'Na dúvida sobre a postura, comece sem peso ou peça ajuda a um profissional.',
  },
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const RULES: [RegExp, string][] = [
  [/bicicleta/, 'cycle'],
  [/esteira|corrida|caminhada|eliptico|escada|corda naval|pular corda/, 'run'],
  [/remo ergometrico|face pull|crucifixo invertido|remada alta/, 'row'],
  [/prancha|hollow|ponte de gluteo isometrica/, 'plank'],
  [/panturrilha/, 'calf_raise'],
  [/encolhimento/, 'shrug'],
  [/barra fixa|suspensao/, 'pullup'],
  [/puxada|pulldown/, 'pulldown'],
  [/remada/, 'row'],
  [/levantamento terra|stiff|extensao lombar/, 'deadlift'],
  [/elevacao pelvica|gluteo|ponte/, 'hip_thrust'],
  [/cadeira extensora/, 'leg_extension'],
  [/flexora/, 'leg_curl'],
  [/afundo|avanco|passada|step-up|bulgaro/, 'lunge'],
  [/agachamento|hack|leg press/, 'squat'],
  [/inclinado|inclinada/, 'incline'],
  [/crucifixo|peck|voador|crossover|pullover/, 'fly'],
  [/flexao de braco|paralelas|triceps banco/, 'pushup'],
  [/supino/, 'bench'],
  [/desenvolvimento/, 'shoulder_press'],
  [/elevacao lateral|elevacao frontal/, 'raise'],
  [/rosca de punho/, 'generic'],
  [/rosca/, 'curl'],
  [/triceps (testa|frances)/, 'overhead'],
  [/triceps/, 'pushdown'],
  [/abdominal infra|elevacao de pernas/, 'leg_raise'],
  [/abdominal|crunch|roda abdominal/, 'crunch'],
]

export function patternFor(exerciseName: string): Pattern {
  const n = norm(exerciseName)
  for (const [re, id] of RULES) {
    if (re.test(n)) return PATTERNS[id]
  }
  return PATTERNS.generic
}