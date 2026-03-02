import { prisma } from "@/lib/prisma";
import { ACHIEVEMENT_MAP } from "@/lib/achievements";
import type { Month, Expense, Extra, Saving } from "@prisma/client";

// ─── XP Sources ────────────────────────────────────────────────────────────────

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
  streak: number;
  allSavingEntries: Array<{ date: string; value: number }>;
  months: Array<Month & { expenses: Expense[]; extras: Extra[]; savingEntries: Saving[] }>;
  xp: number;
  level: number;
  unlockedKeys: Set<string>;
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
];

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
