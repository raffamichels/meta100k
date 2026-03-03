// lib/mapa.ts — Utilitário do Mapa do Tesouro
// Calcula fases da jornada narrativa com base no percentual da meta atingido.

export interface Fase {
  key: string;
  nome: string;
  emoji: string;
  descricao: string;
  min: number; // percentual mínimo (inclusivo)
  max: number; // percentual máximo (inclusivo)
  xp: number;  // XP bônus ao entrar na fase
  achievementKey: string | null;
}

export const FASES: Fase[] = [
  {
    key: "village",
    nome: "Vila da Partida",
    emoji: "🏡",
    descricao: "Todo herói começa em algum lugar. Você deu o primeiro passo e saiu da vila.",
    min: 0, max: 9, xp: 0, achievementKey: null,
  },
  {
    key: "forest",
    nome: "Floresta dos Primeiros Passos",
    emoji: "🌲",
    descricao: "A jornada começa a valer. A floresta é densa, mas cada poupança abre um novo caminho.",
    min: 10, max: 24, xp: 100, achievementKey: "map_forest",
  },
  {
    key: "plains",
    nome: "Planície da Determinação",
    emoji: "🌾",
    descricao: "O horizonte se abre. Você passou do primeiro grande marco — 1/4 da meta.",
    min: 25, max: 39, xp: 200, achievementKey: "map_plains",
  },
  {
    key: "mountain",
    nome: "Montanha da Disciplina",
    emoji: "⛰️",
    descricao: "A subida fica mais difícil. Aqui a maioria desiste. Você está no meio do caminho.",
    min: 40, max: 54, xp: 350, achievementKey: "map_mountain",
  },
  {
    key: "cave",
    nome: "Caverna do Ouro",
    emoji: "🪨",
    descricao: "Você encontrou as profundezas. O brilho do ouro começa a aparecer nas paredes.",
    min: 55, max: 69, xp: 500, achievementKey: "map_cave",
  },
  {
    key: "fortress",
    nome: "Fortaleza dos Guardiões",
    emoji: "🏰",
    descricao: "Os últimos obstáculos protegem o tesouro. Você chegou onde poucos chegam.",
    min: 70, max: 84, xp: 700, achievementKey: "map_fortress",
  },
  {
    key: "portal",
    nome: "Portal da Riqueza",
    emoji: "🌟",
    descricao: "A energia do portal pulsa. O tesouro está logo além — você consegue quase tocar.",
    min: 85, max: 94, xp: 1000, achievementKey: "map_portal",
  },
  {
    key: "antechamber",
    nome: "Ante-Sala do Tesouro",
    emoji: "💎",
    descricao: "Você está a centímetros do fim. Cada real poupado agora é histórico.",
    min: 95, max: 99, xp: 1500, achievementKey: "map_antechamber",
  },
  {
    key: "treasure",
    nome: "O Grande Tesouro",
    emoji: "👑",
    descricao: "Missão cumprida. Você conquistou os R$100K. Bem-vindo à lenda.",
    min: 100, max: 100, xp: 3000, achievementKey: "map_treasure",
  },
];

/** Retorna a fase correspondente ao percentual (0–100). */
export function getFaseAtual(percentual: number): Fase {
  return FASES.find((f) => percentual >= f.min && percentual <= f.max) ?? FASES[0];
}

/** Percentual de conclusão dentro da fase atual (0–100). */
export function getProgressoNaFase(percentual: number, fase: Fase): number {
  const faseRange = fase.max - fase.min;
  if (faseRange === 0) return 100;
  return Math.min(100, ((percentual - fase.min) / faseRange) * 100);
}

/** Fases já completadas (não inclui a atual). */
export function getFasesConquistadas(percentual: number): Fase[] {
  return FASES.filter((f) => percentual > f.max && f.max < 100);
}

/** Próxima fase após a atual, ou null se já está no tesouro. */
export function getProximaFase(fase: Fase): Fase | null {
  const idx = FASES.findIndex((f) => f.key === fase.key);
  return idx >= 0 && idx < FASES.length - 1 ? FASES[idx + 1] : null;
}
