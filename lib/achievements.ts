export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface AchievementDef {
  key: string;
  icon: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Primeiros passos
  {
    key: "first_save",
    icon: "🥇",
    title: "Primeiro Passo",
    description: "Registre sua primeira economia.",
    rarity: "common",
    xpReward: 20,
  },
  {
    key: "first_expense",
    icon: "📋",
    title: "Organizado",
    description: "Lance sua primeira despesa.",
    rarity: "common",
    xpReward: 10,
  },
  {
    key: "first_salary",
    icon: "💼",
    title: "Salário Registrado",
    description: "Registre seu primeiro salário.",
    rarity: "common",
    xpReward: 15,
  },
  // Streak
  {
    key: "streak_7",
    icon: "⚡",
    title: "Semana de Fogo",
    description: "Economize por 7 dias consecutivos.",
    rarity: "common",
    xpReward: 50,
  },
  {
    key: "streak_30",
    icon: "🔥",
    title: "Mês Inabalável",
    description: "Economize por 30 dias consecutivos.",
    rarity: "rare",
    xpReward: 200,
  },
  {
    key: "streak_100",
    icon: "💎",
    title: "Cem Dias",
    description: "Economize por 100 dias consecutivos.",
    rarity: "epic",
    xpReward: 500,
  },
  {
    key: "streak_365",
    icon: "🌟",
    title: "Um Ano Inteiro",
    description: "Economize por 365 dias consecutivos.",
    rarity: "legendary",
    xpReward: 2000,
  },
  // Poupança acumulada
  {
    key: "save_1k",
    icon: "🌱",
    title: "Primeira Semente",
    description: "Acumule R$1.000 poupados.",
    rarity: "common",
    xpReward: 50,
  },
  {
    key: "save_5k",
    icon: "🌿",
    title: "Crescendo",
    description: "Acumule R$5.000 poupados.",
    rarity: "common",
    xpReward: 100,
  },
  {
    key: "save_10k",
    icon: "🌳",
    title: "Árvore Firme",
    description: "Acumule R$10.000 poupados.",
    rarity: "rare",
    xpReward: 200,
  },
  {
    key: "save_25k",
    icon: "🏅",
    title: "Um Quarto",
    description: "Acumule R$25.000 poupados.",
    rarity: "rare",
    xpReward: 400,
  },
  {
    key: "save_50k",
    icon: "💰",
    title: "Metade do Caminho",
    description: "Acumule R$50.000 poupados.",
    rarity: "epic",
    xpReward: 800,
  },
  {
    key: "save_75k",
    icon: "🚀",
    title: "Sprint Final",
    description: "Acumule R$75.000 poupados.",
    rarity: "epic",
    xpReward: 1200,
  },
  {
    key: "save_100k",
    icon: "👑",
    title: "Meta Atingida!",
    description: "Você chegou aos R$100.000!",
    rarity: "legendary",
    xpReward: 5000,
  },
  // Feitos especiais
  {
    key: "big_day",
    icon: "💥",
    title: "Grande Salto",
    description: "Economize R$1.000 ou mais em um único dia.",
    rarity: "rare",
    xpReward: 150,
  },
  {
    key: "perfect_month",
    icon: "✨",
    title: "Mês Perfeito",
    description: "Economize todos os dias de um mês inteiro.",
    rarity: "epic",
    xpReward: 600,
  },
  {
    key: "consistent_3",
    icon: "📅",
    title: "Consistência",
    description: "Economize em 3 meses consecutivos.",
    rarity: "rare",
    xpReward: 150,
  },
  {
    key: "savings_rate_30",
    icon: "⭐",
    title: "Taxa Excelente",
    description: "Mantenha taxa de poupança ≥ 30% por 3 meses.",
    rarity: "epic",
    xpReward: 400,
  },
  {
    key: "big_extra",
    icon: "🎁",
    title: "Renda Extra",
    description: "Registre uma renda extra de R$500 ou mais.",
    rarity: "common",
    xpReward: 30,
  },
  {
    key: "expense_cutter",
    icon: "✂️",
    title: "Cortador",
    description: "Reduza suas despesas em relação ao mês anterior.",
    rarity: "rare",
    xpReward: 100,
  },
  // Níveis
  {
    key: "level_5",
    icon: "📈",
    title: "Investidor",
    description: "Alcance o nível 5.",
    rarity: "rare",
    xpReward: 0,
  },
  {
    key: "level_8",
    icon: "🏆",
    title: "Milionário",
    description: "Alcance o nível máximo.",
    rarity: "legendary",
    xpReward: 0,
  },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.key, a]));

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: "#90f060",
  rare: "#60a0f0",
  epic: "#a060f0",
  legendary: "#f0c060",
};
