import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENT_MAP,
  generateSeasonalAchievements,
  isDateInSeasonalWindow,
  isFriday13,
} from "@/lib/achievements";
import type { SeasonalAchievementDef } from "@/lib/achievements";
import type { Month, Expense, Extra, Saving } from "@prisma/client";
import { FASES } from "@/lib/mapa";

// ─── XP Sources ────────────────────────────────────────────────────────────────

export const XP_TEMPTATION_BASE = 15; // XP mínimo por tentação resistida
export const XP_SAVE_ANY = 10;
export const XP_SAVE_100 = 25;   // bônus quando economiza R$100+ num dia
export const XP_SAVE_1000 = 100; // bônus quando economiza R$1000+ num dia
export const XP_LOG_EXPENSE = 5;
export const XP_LOG_SALARY = 15;
export const XP_LOG_EXTRA = 8;
export const XP_STREAK_7 = 50;
export const XP_STREAK_30 = 200;
export const XP_STREAK_100 = 500;

// ─── Levels ────────────────────────────────────────────────────────────────────

export interface LevelDef {
  level: number;
  icon: string;
  name: string;
  minXP: number;
}

export const LEVELS: LevelDef[] = [
  { level: 1, icon: "🌱", name: "Semente",    minXP: 0 },
  { level: 2, icon: "🌿", name: "Broto",      minXP: 200 },
  { level: 3, icon: "💰", name: "Poupador",   minXP: 500 },
  { level: 4, icon: "🛡️", name: "Guardião",   minXP: 1000 },
  { level: 5, icon: "📈", name: "Investidor", minXP: 2000 },
  { level: 6, icon: "💎", name: "Acumulador", minXP: 4000 },
  { level: 7, icon: "👑", name: "Magnata",    minXP: 8000 },
  { level: 8, icon: "🏆", name: "Milionário", minXP: 15000 },
];

export function calcLevel(xp: number): LevelDef {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXP) current = l;
  }
  return current;
}

export function xpToNextLevel(xp: number): { current: LevelDef; next: LevelDef | null; progress: number } {
  const current = calcLevel(xp);
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level + 1);
  const next = nextIndex >= 0 ? LEVELS[nextIndex] : null;

  if (!next) return { current, next: null, progress: 100 };

  const rangeMin = current.minXP;
  const rangeMax = next.minXP;
  const progress = Math.min(((xp - rangeMin) / (rangeMax - rangeMin)) * 100, 100);
  return { current, next, progress };
}

// ─── Add XP ───────────────────────────────────────────────────────────────────

export async function addXP(userId: string, amount: number): Promise<{ newXp: number; leveledUp: boolean; newLevel: LevelDef }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } });
  if (!user) throw new Error("User not found");

  const oldLevel = calcLevel(user.xp);
  const newXp = user.xp + amount;
  const newLevel = calcLevel(newXp);
  const leveledUp = newLevel.level > oldLevel.level;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel.level },
  });

  return { newXp, leveledUp, newLevel };
}

// ─── Achievement Checking ─────────────────────────────────────────────────────

type CheckContext = {
  userId: string;
  totalSaved: number;
  goal: number; // meta do usuário (ex: 100000)
  streak: number;
  allSavingEntries: Array<{ date: string; value: number }>;
  months: Array<Month & { expenses: Expense[]; extras: Extra[]; savingEntries: Saving[] }>;
  xp: number;
  level: number;
  unlockedKeys: Set<string>;
  today: string; // YYYY-MM-DD
};

export async function checkAndUnlockAchievements(ctx: CheckContext): Promise<string[]> {
  const newKeys: string[] = [];

  const tryUnlock = async (key: string) => {
    if (ctx.unlockedKeys.has(key)) return;
    const def = ACHIEVEMENT_MAP.get(key);
    if (!def) return;
    try {
      await prisma.userAchievement.create({ data: { userId: ctx.userId, key } });
      ctx.unlockedKeys.add(key);
      newKeys.push(key);
      if (def.xpReward > 0) {
        await prisma.user.update({ where: { id: ctx.userId }, data: { xp: { increment: def.xpReward } } });
      }
    } catch {
      // already exists (unique constraint)
    }
  };

  // Primeiros lançamentos
  if (ctx.allSavingEntries.length > 0) await tryUnlock("first_save");

  const hasExpenses = ctx.months.some((m) => m.expenses.length > 0);
  if (hasExpenses) await tryUnlock("first_expense");

  const hasSalary = ctx.months.some((m) => m.salary > 0);
  if (hasSalary) await tryUnlock("first_salary");

  // Streak
  if (ctx.streak >= 7) await tryUnlock("streak_7");
  if (ctx.streak >= 30) await tryUnlock("streak_30");
  if (ctx.streak >= 100) await tryUnlock("streak_100");
  if (ctx.streak >= 365) await tryUnlock("streak_365");

  // Poupança acumulada
  if (ctx.totalSaved >= 1000) await tryUnlock("save_1k");
  if (ctx.totalSaved >= 5000) await tryUnlock("save_5k");
  if (ctx.totalSaved >= 10000) await tryUnlock("save_10k");
  if (ctx.totalSaved >= 25000) await tryUnlock("save_25k");
  if (ctx.totalSaved >= 50000) await tryUnlock("save_50k");
  if (ctx.totalSaved >= 75000) await tryUnlock("save_75k");
  if (ctx.totalSaved >= 100000) await tryUnlock("save_100k");

  // Mapa do Tesouro — desbloqueio de conquistas para cada fase atingida
  // O XP bônus é concedido via xpReward da conquista ao desbloquear
  if (ctx.goal > 0) {
    const pct = Math.min((ctx.totalSaved / ctx.goal) * 100, 100);
    for (const fase of FASES) {
      if (fase.achievementKey && pct >= fase.min) {
        await tryUnlock(fase.achievementKey);
      }
    }
  }

  // Grande salto (R$1000+ em um dia)
  const dayMap = new Map<string, number>();
  for (const s of ctx.allSavingEntries) {
    dayMap.set(s.date, (dayMap.get(s.date) ?? 0) + s.value);
  }
  const bigDayExists = [...dayMap.values()].some((v) => v >= 1000);
  if (bigDayExists) await tryUnlock("big_day");

  // Mês perfeito (economizou todos os dias de algum mês)
  for (const month of ctx.months) {
    if (month.savingEntries.length === 0) continue;
    const [y, m] = month.key.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const daysWithSaving = new Set(month.savingEntries.filter((s) => s.value >= 1).map((s) => s.date)).size;
    if (daysWithSaving >= daysInMonth) {
      await tryUnlock("perfect_month");
      break;
    }
  }

  // Consistência: 3 meses consecutivos com economia
  const sortedMonths = [...ctx.months].sort((a, b) => a.key.localeCompare(b.key));
  let consecutiveSavingMonths = 0;
  for (let i = sortedMonths.length - 1; i >= 0; i--) {
    if (sortedMonths[i].savings > 0) {
      consecutiveSavingMonths++;
      if (consecutiveSavingMonths >= 3) { await tryUnlock("consistent_3"); break; }
    } else break;
  }

  // Taxa de poupança ≥ 30% por 3 meses
  const salaryMonths = sortedMonths.filter((m) => m.salary > 0);
  let excellentRateCount = 0;
  for (const m of salaryMonths.slice(-3)) {
    if (m.salary > 0 && m.savings / m.salary >= 0.30) excellentRateCount++;
  }
  if (excellentRateCount >= 3) await tryUnlock("savings_rate_30");

  // Renda extra R$500+
  const bigExtra = ctx.months.some((m) => m.extras.some((e) => e.value >= 500));
  if (bigExtra) await tryUnlock("big_extra");

  // Cortador de gastos
  if (sortedMonths.length >= 2) {
    const last = sortedMonths[sortedMonths.length - 1];
    const prev = sortedMonths[sortedMonths.length - 2];
    const lastExp = last.expenses.reduce((a, e) => a + e.value, 0);
    const prevExp = prev.expenses.reduce((a, e) => a + e.value, 0);
    if (prevExp > 0 && lastExp < prevExp) await tryUnlock("expense_cutter");
  }

  // Níveis
  if (ctx.level >= 5) await tryUnlock("level_5");
  if (ctx.level >= 8) await tryUnlock("level_8");

  return newKeys;
}

// ─── Seasonal Achievements ────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, "0"); }

function getWindowStartStr(w: SeasonalAchievementDef["window"], year: number): string {
  const y = year + (w.yearOffset ?? 0);
  return `${y}-${pad2(w.monthStart)}-${pad2(w.dayStart)}`;
}

function getWindowEndStr(w: SeasonalAchievementDef["window"], year: number): string {
  const yBase = year + (w.yearOffset ?? 0);
  const y = w.crossYear ? yBase + 1 : yBase;
  return `${y}-${pad2(w.monthEnd)}-${pad2(w.dayEnd)}`;
}

function evaluateSeasonalCondition(ach: SeasonalAchievementDef, ctx: CheckContext): boolean {
  const { conditionType, conditionParam = 0, window, year } = ach;

  const wStart = getWindowStartStr(window, year);
  const wEnd   = getWindowEndStr(window, year);

  // Economies dentro da janela
  const savingsInWindow = ctx.allSavingEntries.filter(s => s.date >= wStart && s.date <= wEnd);
  const savingDaysInWindow = new Set(savingsInWindow.map(s => s.date));

  // Todas as despesas e extras do contexto
  const allExpenses = ctx.months.flatMap(m => m.expenses);
  const allExtras   = ctx.months.flatMap(m => m.extras);

  const mk = (y: number, m: number) => `${y}-${pad2(m)}`;

  switch (conditionType) {

    case "saving_on_date":
    case "saving_on_any_date_in_window":
      return savingsInWindow.length > 0;

    case "saving_days_in_window":
      return savingDaysInWindow.size >= conditionParam;

    case "saving_entries_in_window":
      return savingsInWindow.length >= conditionParam;

    case "savings_sum_in_window":
      return savingsInWindow.reduce((s, e) => s + e.value, 0) >= conditionParam;

    case "savings_sum_month": {
      const month = ctx.months.find(m => m.key === mk(year, window.monthStart));
      return (month?.savings ?? 0) >= conditionParam;
    }

    case "savings_rate_month": {
      const month = ctx.months.find(m => m.key === mk(year, window.monthStart));
      if (!month || month.salary <= 0) return false;
      return month.savings / month.salary >= conditionParam;
    }

    case "savings_all_days_in_month": {
      const month = ctx.months.find(m => m.key === mk(year, window.monthStart));
      if (!month) return false;
      const [my, mm] = month.key.split("-").map(Number);
      const daysInMonth = new Date(my, mm, 0).getDate();
      const daysWithSaving = new Set(
        month.savingEntries.filter(s => s.value >= 1).map(s => s.date)
      ).size;
      return daysWithSaving >= daysInMonth;
    }

    case "savings_all_days_in_two_months": {
      // maratona_fim_de_ano: nov + dez do mesmo ano
      const nov = ctx.months.find(m => m.key === mk(year, 11));
      const dec = ctx.months.find(m => m.key === mk(year, 12));
      if (!nov || !dec) return false;
      const novDays = new Date(year, 11, 0).getDate(); // 30
      const decDays = new Date(year, 12, 0).getDate(); // 31
      const novSaving = new Set(nov.savingEntries.filter(s => s.value >= 1).map(s => s.date)).size;
      const decSaving = new Set(dec.savingEntries.filter(s => s.value >= 1).map(s => s.date)).size;
      return novSaving >= novDays && decSaving >= decDays;
    }

    case "savings_sum_in_season": {
      // Determina os 3 meses da estação a partir da janela
      let months3: string[];
      if (window.crossYear) {
        // verao_de_fogo: dez/year, jan/year+1, fev/year+1
        months3 = [mk(year, 12), mk(year + 1, 1), mk(year + 1, 2)];
      } else {
        months3 = [];
        for (let m = window.monthStart; m <= window.monthEnd; m++) {
          months3.push(mk(year, m));
        }
      }
      return months3.every(key => {
        const month = ctx.months.find(m => m.key === key);
        return (month?.savings ?? 0) >= conditionParam;
      });
    }

    case "expenses_zero_on_date": {
      // Verifica zero despesas em toda a janela (data exata ou período)
      const exp = allExpenses.filter(e => e.date >= wStart && e.date <= wEnd);
      return exp.length === 0;
    }

    case "expenses_reduced_vs_prev_month": {
      const currM  = window.monthStart;
      const prevM  = currM === 1 ? 12 : currM - 1;
      const prevY  = currM === 1 ? year - 1 : year;
      const curr   = ctx.months.find(m => m.key === mk(year, currM));
      const prev   = ctx.months.find(m => m.key === mk(prevY, prevM));
      if (!curr || !prev) return false;
      const currExp = curr.expenses.reduce((s, e) => s + e.value, 0);
      const prevExp = prev.expenses.reduce((s, e) => s + e.value, 0);
      if (prevExp <= 0) return false;
      // conditionParam = fração máxima aceita (ex: 0.9 = 90% do mês anterior)
      return currExp <= prevExp * conditionParam;
    }

    case "expenses_capped_in_window": {
      // Soma de despesas na janela ≤ média semanal × conditionParam
      const expInWindow = allExpenses
        .filter(e => e.date >= wStart && e.date <= wEnd)
        .reduce((s, e) => s + e.value, 0);
      // Média semanal: total de despesas / (meses com despesas × 4,33)
      const monthsWithExp = ctx.months.filter(m => m.expenses.length > 0);
      const totalExp = monthsWithExp.flatMap(m => m.expenses).reduce((s, e) => s + e.value, 0);
      const avgWeekly = monthsWithExp.length > 0 ? totalExp / (monthsWithExp.length * 4.33) : 0;
      if (avgWeekly <= 0) return false;
      return expInWindow <= avgWeekly * conditionParam;
    }

    case "expense_max_in_month": {
      const month = ctx.months.find(m => m.key === mk(year, window.monthStart));
      if (!month) return true; // sem despesas = condição satisfeita
      return month.expenses.every(e => e.value <= conditionParam);
    }

    case "extra_in_window": {
      return allExtras.some(e => e.date >= wStart && e.date <= wEnd && e.value >= conditionParam);
    }

    case "extra_count_in_window": {
      const count = allExtras.filter(e => e.date >= wStart && e.date <= wEnd).length;
      return count >= conditionParam;
    }

    case "streak_in_window":
      // Verifica se o streak atual atinge o mínimo durante o período
      return ctx.streak >= conditionParam;

    case "salary_and_saving_in_window": {
      // Caso especial: inicio_de_trimestre — verifica qualquer início de trimestre do ano
      if (ach.key.startsWith("inicio_de_trimestre")) {
        return [1, 4, 7, 10].some(qm => {
          const qKey = mk(year, qm);
          const month = ctx.months.find(m => m.key === qKey);
          if (!month || month.salary <= 0) return false;
          const qStart = `${year}-${pad2(qm)}-01`;
          const qEnd   = `${year}-${pad2(qm)}-03`;
          return ctx.allSavingEntries.some(s => s.date >= qStart && s.date <= qEnd);
        });
      }
      // Caso geral: salário no mês da janela + economia dentro da janela
      const month = ctx.months.find(m => m.key === mk(year, window.monthStart));
      if (!month || month.salary <= 0) return false;
      return savingsInWindow.length > 0;
    }

    case "months_with_savings_count": {
      // Conta meses do ano com savings > 0 (usa ctx.months do ano corrente)
      const yearMonths = ctx.months.filter(m => m.key.startsWith(`${year}-`));
      const count = yearMonths.filter(m => m.savings > 0).length;
      return count >= conditionParam;
    }

    case "all_months_in_quarter": {
      const quarterMap: Record<number, number[]> = {
        1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12],
      };
      const qMonths = quarterMap[conditionParam] ?? [];
      return qMonths.every(m => {
        const month = ctx.months.find(mo => mo.key === mk(year, m));
        return (month?.savings ?? 0) > 0;
      });
    }

    case "all_months_in_first_half": {
      // meio_de_ano: jan–jun do mesmo ano
      return [1, 2, 3, 4, 5, 6].every(m => {
        const month = ctx.months.find(mo => mo.key === mk(year, m));
        return (month?.savings ?? 0) > 0;
      });
    }

    case "all_months_in_year": {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every(m => {
        const month = ctx.months.find(mo => mo.key === mk(year, m));
        return (month?.savings ?? 0) > 0;
      });
    }

    case "total_saved_threshold":
      return ctx.totalSaved >= conditionParam;

    case "saving_on_friday_13":
      return ctx.allSavingEntries
        .filter(s => s.date.startsWith(`${year}`))
        .some(s => isFriday13(s.date));

    case "saving_on_leap_day":
      return ctx.allSavingEntries.some(s => s.date.endsWith("-02-29"));

    default:
      return false;
  }
}

export async function checkSeasonalAchievements(ctx: CheckContext): Promise<string[]> {
  const newKeys: string[] = [];
  const year = Number(ctx.today.split("-")[0]);

  // Verifica conquistas do ano corrente E do ano anterior
  // (necessário para janelas cross-year como q4_invencivel e reveillon_de_campeao)
  const toCheck = [
    ...generateSeasonalAchievements(year),
    ...generateSeasonalAchievements(year - 1),
  ];

  for (const ach of toCheck) {
    if (ctx.unlockedKeys.has(ach.key)) continue;
    if (!isDateInSeasonalWindow(ctx.today, ach.window, ach.year)) continue;
    if (!evaluateSeasonalCondition(ach, ctx)) continue;

    try {
      await prisma.userAchievement.create({ data: { userId: ctx.userId, key: ach.key } });
      ctx.unlockedKeys.add(ach.key);
      newKeys.push(ach.key);
      if (ach.xpReward > 0) {
        await prisma.user.update({
          where: { id: ctx.userId },
          data: { xp: { increment: ach.xpReward } },
        });
      }
    } catch {
      // unique constraint: conquista já desbloqueada
    }
  }

  return newKeys;
}

// ─── Streak Shields ───────────────────────────────────────────────────────────

/**
 * Aplica escudo de streak se o usuário perdeu um dia mas tem escudo disponível.
 * Retorna true se o escudo foi consumido.
 */
export async function applyStreakShieldIfNeeded(
  userId: string,
  currentStreak: number
): Promise<{ shieldUsed: boolean; shields: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakShields: true, maxStreak: true },
  });
  if (!user) return { shieldUsed: false, shields: 0 };

  // Atualiza recorde
  if (currentStreak > user.maxStreak) {
    await prisma.user.update({ where: { id: userId }, data: { maxStreak: currentStreak } });
  }

  return { shieldUsed: false, shields: user.streakShields };
}

/**
 * Ao completar 7 dias consecutivos, ganha +1 escudo (máx 2).
 */
export async function grantStreakShieldIfEarned(userId: string, streak: number): Promise<boolean> {
  if (streak > 0 && streak % 7 === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { streakShields: true } });
    if (!user) return false;
    if (user.streakShields < 2) {
      await prisma.user.update({
        where: { id: userId },
        data: { streakShields: Math.min(user.streakShields + 1, 2) },
      });
      return true;
    }
  }
  return false;
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export interface ChallengeTemplate {
  key: string;
  type: "weekly" | "monthly";
  title: (target: number) => string;
  description: (target: number) => string;
  xpReward: number;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    key: "save_target",
    type: "weekly",
    title: (t) => `Guarde R$${Math.round(t).toLocaleString("pt-BR")} esta semana`,
    description: (t) => `Acumule R$${Math.round(t).toLocaleString("pt-BR")} em economias nesta semana.`,
    xpReward: 80,
  },
  {
    key: "daily_streak",
    type: "weekly",
    title: () => "5 dias seguidos",
    description: () => "Economize por pelo menos 5 dias consecutivos esta semana.",
    xpReward: 100,
  },
  {
    key: "save_month_target",
    type: "monthly",
    title: (t) => `Meta mensal: R$${Math.round(t).toLocaleString("pt-BR")}`,
    description: (t) => `Economize pelo menos R$${Math.round(t).toLocaleString("pt-BR")} este mês.`,
    xpReward: 200,
  },
  {
    key: "big_day_challenge",
    type: "weekly",
    title: () => "Grande Salto",
    description: () => "Economize R$200 ou mais em um único dia esta semana.",
    xpReward: 120,
  },
  // ── Desafios do Cofre do Diabo ─────────────────────────────────────────────
  {
    key: "resist_3_temptations",
    type: "weekly",
    title: () => "Resistência Tripla",
    description: () => "Registre 3 tentações resistidas nesta semana.",
    xpReward: 80,
  },
  {
    key: "resist_big",
    type: "weekly",
    title: () => "Grande Resistência",
    description: () => "Resista a uma tentação acima de R$500 nesta semana.",
    xpReward: 120,
  },
  {
    key: "resist_daily",
    type: "weekly",
    title: () => "5 Dias no Cofre",
    description: () => "Registre ao menos 1 tentação por 5 dias diferentes nesta semana.",
    xpReward: 150,
  },
];

/** Calcula XP ganho ao registrar uma tentação, baseado no valor resistido. */
export function calcTemptationXP(value: number): number {
  let xp = XP_TEMPTATION_BASE;
  if (value >= 50)   xp += 5;
  if (value >= 200)  xp += 15;
  if (value >= 500)  xp += 30;
  if (value >= 1000) xp += 50;
  if (value >= 5000) xp += 75;
  return xp;
}

// ─── Devil Achievement Checking ───────────────────────────────────────────────

type TemptationEntry = { id: string; date: string; value: number; category: string };

/**
 * Verifica e desbloqueia conquistas do Cofre do Diabo.
 * Deve ser chamado após criar uma tentação.
 */
export async function checkDevilAchievements(
  userId: string,
  temptations: TemptationEntry[]
): Promise<string[]> {
  if (temptations.length === 0) return [];

  const unlockedRaw = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true },
  });
  const unlocked = new Set(unlockedRaw.map((a) => a.key));
  const newKeys: string[] = [];

  const tryUnlock = async (key: string) => {
    if (unlocked.has(key)) return;
    const def = ACHIEVEMENT_MAP.get(key);
    if (!def) return;
    try {
      await prisma.userAchievement.create({ data: { userId, key } });
      unlocked.add(key);
      newKeys.push(key);
      if (def.xpReward > 0) {
        await prisma.user.update({ where: { id: userId }, data: { xp: { increment: def.xpReward } } });
      }
    } catch { /* já existe */ }
  };

  const count = temptations.length;
  const totalValue = temptations.reduce((s, t) => s + t.value, 0);
  const categories = new Set(temptations.map((t) => t.category));
  const hasBig = temptations.some((t) => t.value >= 5000);

  // Conquistas por quantidade
  if (count >= 1)   await tryUnlock("devil_first");
  if (count >= 10)  await tryUnlock("devil_10");
  if (count >= 50)  await tryUnlock("devil_50");
  if (count >= 100) await tryUnlock("devil_100");

  // Conquistas por valor acumulado
  if (totalValue >= 1000)  await tryUnlock("devil_value_1k");
  if (totalValue >= 10000) await tryUnlock("devil_value_10k");
  if (totalValue >= 50000) await tryUnlock("devil_value_50k");

  // Tentação grande (R$5.000+)
  if (hasBig) await tryUnlock("devil_big");

  // 5 categorias diferentes
  if (categories.size >= 5) await tryUnlock("devil_categories");

  // Semana Blindada: 7 dias consecutivos com ao menos 1 tentação
  const sortedDates = [...new Set(temptations.map((t) => t.date))].sort();
  let maxStreak = 1;
  let curStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      curStreak++;
      if (curStreak > maxStreak) maxStreak = curStreak;
    } else {
      curStreak = 1;
    }
  }
  if (maxStreak >= 7) await tryUnlock("devil_week");

  return newKeys;
}

// ─── Devil Challenge Progress ─────────────────────────────────────────────────

/**
 * Atualiza o progresso dos desafios de tentação da semana atual.
 */
export async function updateDevilChallengeProgress(
  userId: string,
  weekTemptations: TemptationEntry[]
): Promise<string[]> {
  const { start: wStart } = getWeekBounds();
  const completed: string[] = [];

  const weekCh = await prisma.challenge.findFirst({
    where: { userId, type: "weekly", startDate: wStart, completed: false },
  });
  if (!weekCh) return completed;

  let current = 0;

  if (weekCh.key === "resist_3_temptations") {
    current = weekTemptations.length; // total de tentações na semana
  } else if (weekCh.key === "resist_big") {
    current = weekTemptations.some((t) => t.value >= 500) ? 1 : 0;
  } else if (weekCh.key === "resist_daily") {
    current = new Set(weekTemptations.map((t) => t.date)).size; // dias distintos
  } else {
    return completed; // desafio não é de tentações
  }

  const done = current >= weekCh.target;
  await prisma.challenge.update({
    where: { id: weekCh.id },
    data: { current, completed: done, completedAt: done ? new Date() : null },
  });
  if (done) {
    completed.push(weekCh.key);
    await prisma.user.update({ where: { id: userId }, data: { xp: { increment: weekCh.xpReward } } });
  }

  return completed;
}

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function getMonthBounds(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1).toISOString().split("T")[0];
  const end = new Date(y, m + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

export async function generateChallengesIfNeeded(
  userId: string,
  avgWeeklySavings: number,
  avgMonthlySavings: number
): Promise<void> {
  const { start: wStart, end: wEnd } = getWeekBounds();
  const { start: mStart, end: mEnd } = getMonthBounds();

  // Check if weekly challenge exists
  const weeklyExists = await prisma.challenge.findFirst({
    where: { userId, type: "weekly", startDate: wStart },
  });

  if (!weeklyExists) {
    // Randomly pick a weekly template (weighted toward save_target)
    const templates = CHALLENGE_TEMPLATES.filter((t) => t.type === "weekly");
    const pick = templates[Math.floor(Math.random() * templates.length)];
    const target = pick.key === "save_target" ? Math.max(avgWeeklySavings * 1.1, 50) :
                   pick.key === "big_day_challenge" ? 200 :
                   5; // daily_streak: target = 5 dias
    await prisma.challenge.create({
      data: { userId, type: "weekly", key: pick.key, target, xpReward: pick.xpReward, startDate: wStart, endDate: wEnd },
    });
  }

  // Check if monthly challenge exists
  const monthlyExists = await prisma.challenge.findFirst({
    where: { userId, type: "monthly", startDate: mStart },
  });

  if (!monthlyExists) {
    const target = Math.max(avgMonthlySavings * 1.05, 200);
    await prisma.challenge.create({
      data: { userId, type: "monthly", key: "save_month_target", target, xpReward: 200, startDate: mStart, endDate: mEnd },
    });
  }
}

export async function updateChallengeProgress(
  userId: string,
  currentStreak: number,
  weekSavings: number,
  monthSavings: number,
  weekDayMap: Map<string, number>
): Promise<string[]> {
  const { start: wStart } = getWeekBounds();
  const { start: mStart } = getMonthBounds();
  const completed: string[] = [];

  const weeklyCh = await prisma.challenge.findFirst({
    where: { userId, type: "weekly", startDate: wStart, completed: false },
  });

  if (weeklyCh) {
    let current = 0;
    if (weeklyCh.key === "save_target") current = weekSavings;
    else if (weeklyCh.key === "daily_streak") current = Math.min(currentStreak, 7);
    else if (weeklyCh.key === "big_day_challenge") {
      current = [...weekDayMap.values()].some((v) => v >= 200) ? 200 : 0;
    }

    const done = current >= weeklyCh.target;
    await prisma.challenge.update({
      where: { id: weeklyCh.id },
      data: { current, completed: done, completedAt: done ? new Date() : null },
    });
    if (done) {
      completed.push(weeklyCh.key);
      await prisma.user.update({ where: { id: userId }, data: { xp: { increment: weeklyCh.xpReward } } });
    }
  }

  const monthlyCh = await prisma.challenge.findFirst({
    where: { userId, type: "monthly", startDate: mStart, completed: false },
  });

  if (monthlyCh) {
    const current = monthSavings;
    const done = current >= monthlyCh.target;
    await prisma.challenge.update({
      where: { id: monthlyCh.id },
      data: { current, completed: done, completedAt: done ? new Date() : null },
    });
    if (done) {
      completed.push(monthlyCh.key);
      await prisma.user.update({ where: { id: userId }, data: { xp: { increment: monthlyCh.xpReward } } });
    }
  }

  return completed;
}
