"use server";

import { prisma } from "@/lib/prisma";
import {
  addXP,
  checkAndUnlockAchievements,
  checkSeasonalAchievements,
  generateChallengesIfNeeded,
  updateChallengeProgress,
  grantStreakShieldIfEarned,
} from "@/lib/gamification";
import { calcDailyStreak } from "@/lib/utils";
import { calcTotalSaved, calcAvgMonthlySavings } from "@/lib/calculations";

export type GamificationResult = {
  xpGained: number;
  leveledUp: boolean;
  newLevelIcon: string;
  newLevelName: string;
  newAchievements: string[]; // keys
};

export async function runGamificationCheck(
  userId: string,
  xpAmount: number
): Promise<GamificationResult> {
  // Carrega dados completos do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      months: {
        include: { expenses: true, extras: true, savingEntries: true },
      },
      achievements: true,
    },
  });
  if (!user) return { xpGained: 0, leveledUp: false, newLevelIcon: "🌱", newLevelName: "Semente", newAchievements: [] };

  // Adiciona XP
  const { leveledUp, newLevel } = await addXP(userId, xpAmount);

  // Calcula dados para checar conquistas
  const allSavingEntries = user.months.flatMap((m) => m.savingEntries);
  const streak = calcDailyStreak(allSavingEntries);
  const totalSavedData = { goal: user.goal, baseAmount: user.baseAmount, months: user.months };
  const totalSaved = calcTotalSaved(totalSavedData);
  const unlockedKeys = new Set(user.achievements.map((a) => a.key));

  // Recarrega level atualizado
  const freshUser = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } });
  const currentLevel = freshUser ? freshUser.level : user.level;

  // Data de hoje (usada nas conquistas sazonais e desafios)
  const today = new Date().toISOString().split("T")[0];

  // Contexto compartilhado para as verificações de conquistas
  const checkCtx = {
    userId,
    totalSaved,
    goal: user.goal, // necessário para calcular fases do Mapa do Tesouro
    streak,
    allSavingEntries,
    months: user.months,
    xp: freshUser?.xp ?? user.xp,
    level: currentLevel,
    unlockedKeys,
    today,
  };

  // Checa e desbloqueia conquistas permanentes
  const newAchievements = await checkAndUnlockAchievements(checkCtx);

  // Checa e desbloqueia conquistas sazonais
  const seasonalNewKeys = await checkSeasonalAchievements(checkCtx);
  newAchievements.push(...seasonalNewKeys);

  // Atualiza recorde de streak
  const maxStreak = user.maxStreak ?? 0;
  if (streak > maxStreak) {
    await prisma.user.update({ where: { id: userId }, data: { maxStreak: streak } });
  }

  // Concede escudo de streak se merecido
  await grantStreakShieldIfEarned(userId, streak);

  // Gera desafios se necessário
  const avgWeekly = calcAvgMonthlySavings(totalSavedData) / 4.33;
  const avgMonthly = calcAvgMonthlySavings(totalSavedData);
  await generateChallengesIfNeeded(userId, avgWeekly, avgMonthly);

  // Atualiza progresso dos desafios
  const monday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().split("T")[0];
  })();

  const weekSavings = allSavingEntries
    .filter((s) => s.date >= monday && s.date <= today)
    .reduce((a, s) => a + s.value, 0);

  const monthKey = today.slice(0, 7);
  const currentMonth = user.months.find((m) => m.key === monthKey);
  const monthSavings = currentMonth?.savings ?? 0;

  const weekDayMap = new Map<string, number>();
  for (const s of allSavingEntries.filter((s) => s.date >= monday && s.date <= today)) {
    weekDayMap.set(s.date, (weekDayMap.get(s.date) ?? 0) + s.value);
  }

  await updateChallengeProgress(userId, streak, weekSavings, monthSavings, weekDayMap);

  return {
    xpGained: xpAmount,
    leveledUp,
    newLevelIcon: newLevel.icon,
    newLevelName: newLevel.name,
    newAchievements,
  };
}
