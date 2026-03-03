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
  // Social
  {
    key: "social_hard",
    icon: "🏁",
    title: "Desafiante Hard",
    description: "Participe de uma corrida ao R$100K com um amigo.",
    rarity: "epic",
    xpReward: 200,
  },
  {
    key: "social_savings",
    icon: "📊",
    title: "Poupador Social",
    description: "Participe de um desafio de economia com um amigo.",
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

// ─── Date Helpers (exportados para uso em gamification.ts) ────────────────────

/** Páscoa pelo algoritmo de Meeus/Butcher */
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Carnaval = sábado 47 dias antes da Páscoa; 4 dias: sáb → quarta */
export function getCarnavalDates(year: number): { start: Date; end: Date } {
  const easter = getEasterDate(year);
  const start = new Date(easter);
  start.setDate(easter.getDate() - 47);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  return { start, end };
}

/** 2º domingo de maio (Dia das Mães BR) */
export function getMothersDayBR(year: number): Date {
  const firstDay = new Date(year, 4, 1);
  const daysToSunday = (7 - firstDay.getDay()) % 7;
  return new Date(year, 4, 1 + daysToSunday + 7);
}

/** 2º domingo de agosto (Dia dos Pais BR) */
export function getFathersDayBR(year: number): Date {
  const firstDay = new Date(year, 7, 1);
  const daysToSunday = (7 - firstDay.getDay()) % 7;
  return new Date(year, 7, 1 + daysToSunday + 7);
}

/** Última sexta-feira de novembro (Black Friday) */
export function getBlackFridayDate(year: number): Date {
  let d = new Date(year, 10, 30);
  while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
  return d;
}

/** true se a data YYYY-MM-DD for uma sexta-feira 13 */
export function isFriday13(dateStr: string): boolean {
  const parts = dateStr.split("-").map(Number);
  if (parts[2] !== 13) return false;
  return new Date(parts[0], parts[1] - 1, 13).getDay() === 5;
}

// ─── Seasonal Types ────────────────────────────────────────────────────────────

export interface SeasonalWindow {
  monthStart: number;  // 1–12
  dayStart: number;    // 1–31
  monthEnd: number;    // 1–12
  dayEnd: number;      // 1–31
  crossYear?: boolean; // true para janelas que cruzam dez/jan (ex: 28/12 – 02/01)
  yearOffset?: number; // offset do ano ao calcular a janela (ex: 1 = ano seguinte, para q4_invencivel)
  floating?: boolean;  // true para datas calculadas (Páscoa, Carnaval, etc.) — informativo
}

export type SeasonalConditionType =
  | "saving_on_date"
  | "saving_on_any_date_in_window"
  | "saving_days_in_window"
  | "saving_entries_in_window"
  | "savings_sum_in_window"
  | "savings_sum_month"
  | "savings_rate_month"
  | "savings_all_days_in_month"
  | "savings_all_days_in_two_months"
  | "savings_sum_in_season"
  | "expenses_zero_on_date"
  | "expenses_reduced_vs_prev_month"
  | "expenses_capped_in_window"
  | "expense_max_in_month"
  | "extra_in_window"
  | "extra_count_in_window"
  | "streak_in_window"
  | "salary_and_saving_in_window"
  | "months_with_savings_count"
  | "all_months_in_quarter"
  | "all_months_in_first_half"
  | "all_months_in_year"
  | "total_saved_threshold"
  | "saving_on_friday_13"
  | "saving_on_leap_day";

export interface SeasonalAchievementDef extends AchievementDef {
  seasonal: true;
  year: number;
  window: SeasonalWindow;
  seasonLabel: string;
  conditionType: SeasonalConditionType;
  conditionParam?: number;
  requiresActiveWindow?: boolean;
}

/** true se dateStr está dentro da janela sazonal do achievement */
export function isDateInSeasonalWindow(
  dateStr: string,
  window: SeasonalWindow,
  year: number
): boolean {
  const date = new Date(dateStr + "T12:00:00");
  const yBase = year + (window.yearOffset ?? 0);

  if (window.crossYear) {
    // Janela cruza virada de ano: [yBase/monthStart/dayStart, (yBase+1)/monthEnd/dayEnd]
    const start = new Date(yBase, window.monthStart - 1, window.dayStart);
    const end = new Date(yBase + 1, window.monthEnd - 1, window.dayEnd);
    return date >= start && date <= end;
  }

  const start = new Date(yBase, window.monthStart - 1, window.dayStart);
  const end = new Date(yBase, window.monthEnd - 1, window.dayEnd);
  return date >= start && date <= end;
}

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateSeasonalAchievements(year: number): SeasonalAchievementDef[] {
  const isLeap = new Date(year, 1, 29).getDate() === 29;
  const carnaval = getCarnavalDates(year);
  const motherDay = getMothersDayBR(year);
  const fatherDay = getFathersDayBR(year);
  const blackFriday = getBlackFridayDate(year);
  const easter = getEasterDate(year);
  // Semana Santa: 7 dias antes da Páscoa (sábado até sexta anterior)
  const holySatStart = new Date(easter);
  holySatStart.setDate(easter.getDate() - 7);

  type T = {
    keyBase: string;
    icon: string;
    title: string;
    description: string;
    rarity: AchievementRarity;
    xpReward: number;
    window: SeasonalWindow;
    seasonLabel: string; // base sem o ano; stamp adiciona o ano
    conditionType: SeasonalConditionType;
    conditionParam?: number;
    requiresActiveWindow?: boolean;
  };

  // Estampa o ano na key e no seasonLabel
  const stamp = (t: T): SeasonalAchievementDef => ({
    key: `${t.keyBase}_${year}`,
    icon: t.icon,
    title: t.title,
    description: t.description,
    rarity: t.rarity,
    xpReward: t.xpReward,
    seasonal: true,
    year,
    window: t.window,
    seasonLabel: `${t.seasonLabel} ${year}`,
    conditionType: t.conditionType,
    conditionParam: t.conditionParam,
    requiresActiveWindow: t.requiresActiveWindow,
  });

  const list: SeasonalAchievementDef[] = [

    // ── Janeiro / Ano Novo ───────────────────────────────────────────────────
    stamp({
      keyBase: "ano_novo", icon: "🎆", title: "Ano Novo, Conta Nova",
      description: `Registre uma economia no dia 01/01/${year}.`,
      rarity: "common", xpReward: 30,
      window: { monthStart: 1, dayStart: 1, monthEnd: 1, dayEnd: 1 },
      seasonLabel: "Janeiro", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "virada_disciplinada", icon: "🌅", title: "Virada Disciplinada",
      description: `Economize em 7 dias distintos entre 01/01 e 07/01/${year}.`,
      rarity: "rare", xpReward: 80,
      window: { monthStart: 1, dayStart: 1, monthEnd: 1, dayEnd: 7 },
      seasonLabel: "Janeiro", conditionType: "saving_days_in_window", conditionParam: 7,
    }),
    stamp({
      keyBase: "resolucao_cumprida", icon: "📋", title: "Resolução Cumprida",
      description: `Salário registrado e ao menos 1 economia antes de 07/01/${year}.`,
      rarity: "rare", xpReward: 60,
      window: { monthStart: 1, dayStart: 1, monthEnd: 1, dayEnd: 7 },
      seasonLabel: "Janeiro", conditionType: "salary_and_saving_in_window",
    }),
    stamp({
      keyBase: "janeiro_milionario", icon: "💰", title: "Janeiro Milionário",
      description: `Acumule R$2.000 em economias durante janeiro de ${year}.`,
      rarity: "epic", xpReward: 150,
      window: { monthStart: 1, dayStart: 1, monthEnd: 1, dayEnd: 31 },
      seasonLabel: "Janeiro", conditionType: "savings_sum_month", conditionParam: 2000,
    }),
    stamp({
      keyBase: "reveillon_de_campeao", icon: "🥂", title: "Réveillon de Campeão",
      description: `Registre uma economia entre 28/12/${year} e 02/01/${year + 1}.`,
      rarity: "common", xpReward: 25,
      window: { monthStart: 12, dayStart: 28, monthEnd: 1, dayEnd: 2, crossYear: true },
      seasonLabel: "Virada", conditionType: "saving_on_any_date_in_window",
    }),

    // ── Fevereiro / Carnaval ─────────────────────────────────────────────────
    stamp({
      keyBase: "amor_pela_meta", icon: "💘", title: "Amor pela Meta",
      description: `Economize em 10 dias distintos entre 01/02 e 14/02/${year}.`,
      rarity: "rare", xpReward: 100,
      window: { monthStart: 2, dayStart: 1, monthEnd: 2, dayEnd: 14 },
      seasonLabel: "Fevereiro", conditionType: "saving_days_in_window", conditionParam: 10,
    }),
    stamp({
      keyBase: "carnaval_imune", icon: "🎭", title: "Carnaval Imune",
      description: `Zero despesas nos 4 dias de Carnaval de ${year}.`,
      rarity: "epic", xpReward: 200,
      window: {
        monthStart: carnaval.start.getMonth() + 1, dayStart: carnaval.start.getDate(),
        monthEnd: carnaval.end.getMonth() + 1, dayEnd: carnaval.end.getDate(), floating: true,
      },
      seasonLabel: "Carnaval", conditionType: "expenses_zero_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "carnaval_poupador", icon: "🥁", title: "Poupador do Carnaval",
      description: `Registre ao menos 1 economia durante os dias de Carnaval de ${year}.`,
      rarity: "common", xpReward: 40,
      window: {
        monthStart: carnaval.start.getMonth() + 1, dayStart: carnaval.start.getDate(),
        monthEnd: carnaval.end.getMonth() + 1, dayEnd: carnaval.end.getDate(), floating: true,
      },
      seasonLabel: "Carnaval", conditionType: "saving_on_any_date_in_window",
    }),
    stamp({
      keyBase: "fevereiro_completo", icon: "📅", title: "Fevereiro sem Falhas",
      description: `Economize todos os dias de fevereiro de ${year}.`,
      rarity: "epic", xpReward: 300,
      window: { monthStart: 2, dayStart: 1, monthEnd: 2, dayEnd: isLeap ? 29 : 28 },
      seasonLabel: "Fevereiro", conditionType: "savings_all_days_in_month",
    }),
    stamp({
      keyBase: "sao_valentim_consciente", icon: "💝", title: "São Valentim Consciente",
      description: `Registre ao menos 1 renda extra em fevereiro de ${year}.`,
      rarity: "common", xpReward: 20,
      window: { monthStart: 2, dayStart: 1, monthEnd: 2, dayEnd: isLeap ? 29 : 28 },
      seasonLabel: "Fevereiro", conditionType: "extra_count_in_window", conditionParam: 1,
    }),

    // ── Março ────────────────────────────────────────────────────────────────
    stamp({
      keyBase: "dia_das_mulheres", icon: "👩", title: "Dia das Mulheres",
      description: `Registre uma economia no dia 08/03/${year}.`,
      rarity: "common", xpReward: 25,
      window: { monthStart: 3, dayStart: 8, monthEnd: 3, dayEnd: 8 },
      seasonLabel: "Março", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "resistencia_total", icon: "🛡️", title: "Resistência Total",
      description: `Zero despesas no Dia do Consumidor (15/03/${year}).`,
      rarity: "rare", xpReward: 80,
      window: { monthStart: 3, dayStart: 15, monthEnd: 3, dayEnd: 15 },
      seasonLabel: "Março", conditionType: "expenses_zero_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "marco_renovado", icon: "🌷", title: "Março Renovado",
      description: `Taxa de poupança ≥ 20% do salário em março de ${year}.`,
      rarity: "rare", xpReward: 100,
      window: { monthStart: 3, dayStart: 1, monthEnd: 3, dayEnd: 31 },
      seasonLabel: "Março", conditionType: "savings_rate_month", conditionParam: 0.2,
    }),
    stamp({
      keyBase: "pascoa_financeira", icon: "🐣", title: "Páscoa Financeira",
      description: `5 ou mais economias nos 7 dias antes da Páscoa de ${year}.`,
      rarity: "rare", xpReward: 80,
      window: {
        monthStart: holySatStart.getMonth() + 1, dayStart: holySatStart.getDate(),
        monthEnd: easter.getMonth() + 1, dayEnd: easter.getDate(), floating: true,
      },
      seasonLabel: "Páscoa", conditionType: "saving_entries_in_window", conditionParam: 5,
    }),

    // ── Abril ────────────────────────────────────────────────────────────────
    stamp({
      keyBase: "primeiro_de_abril_real", icon: "🤡", title: "Não É Mentira!",
      description: `Registre uma economia no dia 01/04/${year}.`,
      rarity: "common", xpReward: 20,
      window: { monthStart: 4, dayStart: 1, monthEnd: 4, dayEnd: 1 },
      seasonLabel: "Abril", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "q1_sobrevivente", icon: "🏅", title: "Sobrevivente do Q1",
      description: `Economias positivas em jan, fev e mar de ${year}.`,
      rarity: "rare", xpReward: 120,
      window: { monthStart: 4, dayStart: 1, monthEnd: 4, dayEnd: 7 },
      seasonLabel: "Q1", conditionType: "all_months_in_quarter", conditionParam: 1,
    }),
    stamp({
      keyBase: "abril_produtivo", icon: "🌸", title: "Abril Produtivo",
      description: `15 ou mais registros de economia em abril de ${year}.`,
      rarity: "rare", xpReward: 90,
      window: { monthStart: 4, dayStart: 1, monthEnd: 4, dayEnd: 30 },
      seasonLabel: "Abril", conditionType: "saving_entries_in_window", conditionParam: 15,
    }),

    // ── Maio ─────────────────────────────────────────────────────────────────
    stamp({
      keyBase: "primeiro_de_maio", icon: "✊", title: "Dia do Trabalhador Poupador",
      description: `Registre uma economia no dia 01/05/${year}.`,
      rarity: "common", xpReward: 25,
      window: { monthStart: 5, dayStart: 1, monthEnd: 5, dayEnd: 1 },
      seasonLabel: "Maio", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "dia_das_maes_consciente", icon: "💐", title: "Dia das Mães com Meta",
      description: `3 ou mais economias na semana do Dia das Mães de ${year}.`,
      rarity: "rare", xpReward: 70,
      window: {
        monthStart: 5, dayStart: Math.max(1, motherDay.getDate() - 3),
        monthEnd: 5, dayEnd: Math.min(31, motherDay.getDate() + 3), floating: true,
      },
      seasonLabel: "Dia das Mães", conditionType: "saving_entries_in_window", conditionParam: 3,
    }),
    stamp({
      keyBase: "maio_forte", icon: "💪", title: "Maio Forte",
      description: `Acumule R$1.500 em economias durante maio de ${year}.`,
      rarity: "rare", xpReward: 100,
      window: { monthStart: 5, dayStart: 1, monthEnd: 5, dayEnd: 31 },
      seasonLabel: "Maio", conditionType: "savings_sum_month", conditionParam: 1500,
    }),
    stamp({
      keyBase: "maio_enxuto", icon: "✂️", title: "Maio Enxuto",
      description: `Nenhuma despesa individual acima de R$200 em maio de ${year}.`,
      rarity: "epic", xpReward: 180,
      window: { monthStart: 5, dayStart: 1, monthEnd: 5, dayEnd: 31 },
      seasonLabel: "Maio", conditionType: "expense_max_in_month", conditionParam: 200,
    }),

    // ── Junho ────────────────────────────────────────────────────────────────
    stamp({
      keyBase: "dia_dos_namorados_meta", icon: "❤️", title: "Casal que Poupa Junto...",
      description: `Registre uma economia no dia 12/06/${year}.`,
      rarity: "common", xpReward: 25,
      window: { monthStart: 6, dayStart: 12, monthEnd: 6, dayEnd: 12 },
      seasonLabel: "Junho", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "festa_junina_parcimoniosa", icon: "🎉", title: "Festa Junina Econômica",
      description: `Economize nos 3 dias: 23, 24 e 25/06/${year}.`,
      rarity: "rare", xpReward: 70,
      window: { monthStart: 6, dayStart: 23, monthEnd: 6, dayEnd: 25 },
      seasonLabel: "Junho", conditionType: "saving_days_in_window", conditionParam: 3,
    }),
    stamp({
      keyBase: "junho_arrochado", icon: "🎯", title: "Junho Arrochado",
      description: `Despesas de junho de ${year} menores que 90% das despesas de maio.`,
      rarity: "epic", xpReward: 200,
      window: { monthStart: 6, dayStart: 1, monthEnd: 6, dayEnd: 30 },
      seasonLabel: "Junho", conditionType: "expenses_reduced_vs_prev_month", conditionParam: 0.9,
    }),
    stamp({
      keyBase: "solsticio_de_poupanca", icon: "☀️", title: "Solstício de Poupança",
      description: `Registre uma economia no dia 21/06/${year}.`,
      rarity: "common", xpReward: 30,
      window: { monthStart: 6, dayStart: 21, monthEnd: 6, dayEnd: 21 },
      seasonLabel: "Junho", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "inverno_financeiro", icon: "❄️", title: "Inverno Financeiro",
      description: `Economias ≥ R$500 em jun, jul e ago de ${year}, individualmente.`,
      rarity: "epic", xpReward: 250,
      window: { monthStart: 6, dayStart: 1, monthEnd: 8, dayEnd: 31 },
      seasonLabel: "Inverno", conditionType: "savings_sum_in_season", conditionParam: 500,
    }),

    // ── Julho ────────────────────────────────────────────────────────────────
    stamp({
      keyBase: "ferias_disciplinadas", icon: "🏖️", title: "Férias Disciplinadas",
      description: `Taxa de poupança ≥ 15% do salário em julho de ${year}.`,
      rarity: "rare", xpReward: 100,
      window: { monthStart: 7, dayStart: 1, monthEnd: 7, dayEnd: 31 },
      seasonLabel: "Julho", conditionType: "savings_rate_month", conditionParam: 0.15,
    }),
    stamp({
      keyBase: "julho_resistente", icon: "🌊", title: "Julho Resistente",
      description: `Economize em 20 ou mais dias distintos em julho de ${year}.`,
      rarity: "epic", xpReward: 180,
      window: { monthStart: 7, dayStart: 1, monthEnd: 7, dayEnd: 31 },
      seasonLabel: "Julho", conditionType: "saving_days_in_window", conditionParam: 20,
    }),
    stamp({
      keyBase: "q2_consistente", icon: "🏅", title: "Consistência no Q2",
      description: `Economias positivas em abr, mai e jun de ${year}.`,
      rarity: "rare", xpReward: 120,
      window: { monthStart: 7, dayStart: 1, monthEnd: 7, dayEnd: 7 },
      seasonLabel: "Q2", conditionType: "all_months_in_quarter", conditionParam: 2,
    }),
    stamp({
      keyBase: "meio_de_ano", icon: "🗓️", title: "Metade do Ano",
      description: `Economias positivas nos 6 primeiros meses de ${year}.`,
      rarity: "legendary", xpReward: 400,
      window: { monthStart: 7, dayStart: 1, monthEnd: 7, dayEnd: 15 },
      seasonLabel: "Julho", conditionType: "all_months_in_first_half",
    }),

    // ── Agosto ───────────────────────────────────────────────────────────────
    stamp({
      keyBase: "dia_dos_pais_planejado", icon: "👨‍👧", title: "Dia dos Pais Planejado",
      description: `3 ou mais economias na semana do Dia dos Pais de ${year}.`,
      rarity: "rare", xpReward: 70,
      window: {
        monthStart: 8, dayStart: Math.max(1, fatherDay.getDate() - 3),
        monthEnd: 8, dayEnd: Math.min(31, fatherDay.getDate() + 3), floating: true,
      },
      seasonLabel: "Dia dos Pais", conditionType: "saving_entries_in_window", conditionParam: 3,
    }),
    stamp({
      keyBase: "agosto_em_chamas", icon: "🔥", title: "Agosto em Chamas",
      description: `Streak de 25 dias ou mais durante agosto de ${year}.`,
      rarity: "epic", xpReward: 200,
      window: { monthStart: 8, dayStart: 1, monthEnd: 8, dayEnd: 31 },
      seasonLabel: "Agosto", conditionType: "streak_in_window", conditionParam: 25,
    }),
    stamp({
      keyBase: "agosto_milionario", icon: "💎", title: "Agosto Milionário",
      description: `Acumule R$2.500 em economias durante agosto de ${year}.`,
      rarity: "epic", xpReward: 180,
      window: { monthStart: 8, dayStart: 1, monthEnd: 8, dayEnd: 31 },
      seasonLabel: "Agosto", conditionType: "savings_sum_month", conditionParam: 2500,
    }),
    stamp({
      keyBase: "renda_extra_agosto", icon: "💼", title: "Extra de Agosto",
      description: `2 ou mais registros de renda extra em agosto de ${year}.`,
      rarity: "rare", xpReward: 80,
      window: { monthStart: 8, dayStart: 1, monthEnd: 8, dayEnd: 31 },
      seasonLabel: "Agosto", conditionType: "extra_count_in_window", conditionParam: 2,
    }),

    // ── Setembro ─────────────────────────────────────────────────────────────
    stamp({
      keyBase: "independencia_financeira", icon: "🇧🇷", title: "Independência Financeira",
      description: `Registre uma economia no dia 07/09/${year}.`,
      rarity: "common", xpReward: 30,
      window: { monthStart: 9, dayStart: 7, monthEnd: 9, dayEnd: 7 },
      seasonLabel: "Setembro", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "primavera_renovada", icon: "🌸", title: "Primavera Renovada",
      description: `Salário registrado e ao menos 1 economia antes de 07/09/${year}.`,
      rarity: "rare", xpReward: 70,
      window: { monthStart: 9, dayStart: 1, monthEnd: 9, dayEnd: 7 },
      seasonLabel: "Setembro", conditionType: "salary_and_saving_in_window",
    }),
    stamp({
      keyBase: "setembro_verde", icon: "🌿", title: "Setembro Verde",
      description: `Taxa de poupança ≥ 25% do salário em setembro de ${year}.`,
      rarity: "epic", xpReward: 200,
      window: { monthStart: 9, dayStart: 1, monthEnd: 9, dayEnd: 30 },
      seasonLabel: "Setembro", conditionType: "savings_rate_month", conditionParam: 0.25,
    }),
    stamp({
      keyBase: "q3_firme", icon: "🏅", title: "Q3 Inabalável",
      description: `Economias positivas em jul, ago e set de ${year}.`,
      rarity: "rare", xpReward: 120,
      window: { monthStart: 10, dayStart: 1, monthEnd: 10, dayEnd: 7 },
      seasonLabel: "Q3", conditionType: "all_months_in_quarter", conditionParam: 3,
    }),
    stamp({
      keyBase: "primavera_florida", icon: "🌺", title: "Primavera Florescendo",
      description: `Economias ≥ R$500 em set, out e nov de ${year}, individualmente.`,
      rarity: "epic", xpReward: 250,
      window: { monthStart: 9, dayStart: 1, monthEnd: 11, dayEnd: 30 },
      seasonLabel: "Primavera", conditionType: "savings_sum_in_season", conditionParam: 500,
    }),

    // ── Outubro ──────────────────────────────────────────────────────────────
    stamp({
      keyBase: "outubro_assustador", icon: "🎃", title: "Outubro Assustador",
      description: `Despesas de outubro de ${year} menores que 87% das de setembro.`,
      rarity: "rare", xpReward: 130,
      window: { monthStart: 10, dayStart: 1, monthEnd: 10, dayEnd: 31 },
      seasonLabel: "Outubro", conditionType: "expenses_reduced_vs_prev_month", conditionParam: 0.87,
    }),
    stamp({
      keyBase: "crianca_responsavel", icon: "🧒", title: "Criança Responsável",
      description: `Zero despesas no Dia das Crianças (12/10/${year}).`,
      rarity: "rare", xpReward: 60,
      window: { monthStart: 10, dayStart: 12, monthEnd: 10, dayEnd: 12 },
      seasonLabel: "Outubro", conditionType: "expenses_zero_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "outubro_mistico", icon: "🔮", title: "Outubro Místico",
      description: `13 ou mais registros de economia em outubro de ${year}.`,
      rarity: "rare", xpReward: 100,
      window: { monthStart: 10, dayStart: 1, monthEnd: 10, dayEnd: 31 },
      seasonLabel: "Outubro", conditionType: "saving_entries_in_window", conditionParam: 13,
    }),
    stamp({
      keyBase: "halloween_poupador", icon: "👻", title: "Halloween Poupador",
      description: `Registre uma economia no Dia Mundial da Poupança (31/10/${year}).`,
      rarity: "common", xpReward: 30,
      window: { monthStart: 10, dayStart: 31, monthEnd: 10, dayEnd: 31 },
      seasonLabel: "Outubro", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "semana_do_horror", icon: "🕷️", title: "Semana do Horror",
      description: `Economize todos os dias de 25 a 31/10/${year}.`,
      rarity: "epic", xpReward: 180,
      window: { monthStart: 10, dayStart: 25, monthEnd: 10, dayEnd: 31 },
      seasonLabel: "Outubro", conditionType: "saving_days_in_window", conditionParam: 7,
    }),

    // ── Novembro ─────────────────────────────────────────────────────────────
    stamp({
      keyBase: "proclamacao_poupadora", icon: "🇧🇷", title: "Proclamação Poupadora",
      description: `Registre uma economia no dia 15/11/${year}.`,
      rarity: "common", xpReward: 25,
      window: { monthStart: 11, dayStart: 15, monthEnd: 11, dayEnd: 15 },
      seasonLabel: "Novembro", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "black_friday_survivor", icon: "🛒", title: "Black Friday Survivor",
      description: `Despesas na semana da Black Friday de ${year} ≤ 60% da média semanal.`,
      rarity: "epic", xpReward: 250,
      window: { monthStart: 11, dayStart: 25, monthEnd: 11, dayEnd: 30 },
      seasonLabel: "Black Friday", conditionType: "expenses_capped_in_window", conditionParam: 0.6,
    }),
    stamp({
      keyBase: "anti_black_friday", icon: "🛡️", title: "Anti Black Friday",
      description: `Zero despesas na sexta-feira da Black Friday de ${year}.`,
      rarity: "legendary", xpReward: 500,
      window: {
        monthStart: 11, dayStart: blackFriday.getDate(),
        monthEnd: 11, dayEnd: blackFriday.getDate(), floating: true,
      },
      seasonLabel: "Black Friday", conditionType: "expenses_zero_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "novembro_reflexivo", icon: "📊", title: "Novembro Reflexivo",
      description: `10 ou mais meses do ano de ${year} com economias positivas.`,
      rarity: "rare", xpReward: 150,
      window: { monthStart: 11, dayStart: 1, monthEnd: 11, dayEnd: 30 },
      seasonLabel: "Novembro", conditionType: "months_with_savings_count", conditionParam: 10,
    }),
    stamp({
      keyBase: "pre_natal_planejado", icon: "🎁", title: "Pré-Natal Planejado",
      description: `Registre ao menos 1 renda extra em novembro de ${year}.`,
      rarity: "common", xpReward: 30,
      window: { monthStart: 11, dayStart: 1, monthEnd: 11, dayEnd: 30 },
      seasonLabel: "Novembro", conditionType: "extra_count_in_window", conditionParam: 1,
    }),

    // ── Dezembro ─────────────────────────────────────────────────────────────
    stamp({
      keyBase: "dezembro_disciplinado", icon: "🎁", title: "Dezembro Disciplinado",
      description: `Taxa de poupança ≥ 10% do salário em dezembro de ${year}.`,
      rarity: "rare", xpReward: 120,
      window: { monthStart: 12, dayStart: 1, monthEnd: 12, dayEnd: 31 },
      seasonLabel: "Dezembro", conditionType: "savings_rate_month", conditionParam: 0.1,
    }),
    stamp({
      keyBase: "natal_economico", icon: "🎄", title: "Natal Econômico",
      description: `Despesas de dezembro de ${year} iguais ou menores que as de novembro.`,
      rarity: "epic", xpReward: 200,
      window: { monthStart: 12, dayStart: 1, monthEnd: 12, dayEnd: 26 },
      seasonLabel: "Natal", conditionType: "expenses_reduced_vs_prev_month", conditionParam: 1.0,
    }),
    stamp({
      keyBase: "ceia_de_campeao", icon: "🍽️", title: "Ceia de Campeão",
      description: `Registre uma economia na véspera de Natal (24/12/${year}).`,
      rarity: "rare", xpReward: 50,
      window: { monthStart: 12, dayStart: 24, monthEnd: 12, dayEnd: 24 },
      seasonLabel: "Natal", conditionType: "saving_on_date", requiresActiveWindow: true,
    }),
    stamp({
      keyBase: "presente_de_si_mesmo", icon: "🎀", title: "O Melhor Presente",
      description: `Registre uma renda extra de R$500 ou mais em dezembro de ${year}.`,
      rarity: "rare", xpReward: 80,
      window: { monthStart: 12, dayStart: 1, monthEnd: 12, dayEnd: 25 },
      seasonLabel: "Dezembro", conditionType: "extra_in_window", conditionParam: 500,
    }),
    stamp({
      keyBase: "fechamento_de_ouro", icon: "🌟", title: "Fechamento de Ouro",
      description: `Taxa de poupança ≥ 30% do salário em dezembro de ${year}.`,
      rarity: "epic", xpReward: 300,
      window: { monthStart: 12, dayStart: 1, monthEnd: 12, dayEnd: 31 },
      seasonLabel: "Dezembro", conditionType: "savings_rate_month", conditionParam: 0.3,
    }),
    stamp({
      keyBase: "ano_virado_na_meta", icon: "👑", title: "Ano Virado na Meta",
      description: `Total acumulado de R$60.000 ou mais até dezembro de ${year}.`,
      rarity: "legendary", xpReward: 600,
      window: { monthStart: 12, dayStart: 20, monthEnd: 12, dayEnd: 31 },
      seasonLabel: "Dezembro", conditionType: "total_saved_threshold", conditionParam: 60000,
    }),
    stamp({
      keyBase: "maratona_fim_de_ano", icon: "🏃", title: "Maratona de Fim de Ano",
      description: `Economize todos os dias de novembro e dezembro de ${year}.`,
      rarity: "legendary", xpReward: 700,
      window: { monthStart: 11, dayStart: 1, monthEnd: 12, dayEnd: 31 },
      seasonLabel: "Fim de Ano", conditionType: "savings_all_days_in_two_months",
    }),
    stamp({
      keyBase: "q4_invencivel", icon: "🏆", title: "Q4 Invencível",
      description: `Economias positivas em out, nov e dez de ${year}.`,
      rarity: "epic", xpReward: 200,
      // Janela no ANO SEGUINTE: o usuário valida entre 01/01–07/01 do próximo ano
      window: { monthStart: 1, dayStart: 1, monthEnd: 1, dayEnd: 7, yearOffset: 1 },
      seasonLabel: "Q4", conditionType: "all_months_in_quarter", conditionParam: 4,
    }),

    // ── Milestones Anuais ─────────────────────────────────────────────────────
    stamp({
      keyBase: "ano_perfeito", icon: "✨", title: "Ano Perfeito",
      description: `Economias positivas em todos os 12 meses de ${year}.`,
      rarity: "legendary", xpReward: 1000,
      window: { monthStart: 1, dayStart: 1, monthEnd: 12, dayEnd: 31 },
      seasonLabel: "Anual", conditionType: "all_months_in_year",
    }),
    stamp({
      keyBase: "verao_de_fogo", icon: "☀️", title: "Verão de Fogo",
      description: `Economias ≥ R$500 em dez/${year}, jan e fev/${year + 1}, individualmente.`,
      rarity: "epic", xpReward: 250,
      window: { monthStart: 12, dayStart: 1, monthEnd: 2, dayEnd: 28, crossYear: true },
      seasonLabel: "Verão", conditionType: "savings_sum_in_season", conditionParam: 500,
    }),
    stamp({
      keyBase: "sexta_13_sortuda", icon: "🍀", title: "Sexta-13 da Sorte",
      description: `Registre uma economia em qualquer sexta-feira 13 de ${year}.`,
      rarity: "rare", xpReward: 100,
      window: { monthStart: 1, dayStart: 1, monthEnd: 12, dayEnd: 31 },
      seasonLabel: "Anual", conditionType: "saving_on_friday_13",
    }),
    stamp({
      keyBase: "inicio_de_trimestre", icon: "📆", title: "Início de Trimestre",
      description: `Salário e economia nos primeiros 3 dias de qualquer trimestre de ${year}.`,
      rarity: "rare", xpReward: 80,
      window: { monthStart: 1, dayStart: 1, monthEnd: 12, dayEnd: 31 },
      seasonLabel: "Anual", conditionType: "salary_and_saving_in_window",
    }),
  ];

  // Ano bissexto: somente quando o ano tem 29/02
  if (isLeap) {
    list.push(stamp({
      keyBase: "ano_bissexto", icon: "📅", title: "Dia Raro",
      description: `Registre uma economia no dia 29/02/${year}.`,
      rarity: "legendary", xpReward: 300,
      window: { monthStart: 2, dayStart: 29, monthEnd: 2, dayEnd: 29 },
      seasonLabel: "Bissexto", conditionType: "saving_on_leap_day", requiresActiveWindow: true,
    }));
  }

  return list;
}

export function getSeasonalAchievementMap(year: number): Map<string, SeasonalAchievementDef> {
  return new Map(generateSeasonalAchievements(year).map((a) => [a.key, a]));
}

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
