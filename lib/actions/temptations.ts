"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addXP, calcTemptationXP, checkDevilAchievements, updateDevilChallengeProgress } from "@/lib/gamification";
import type { GamificationResult } from "@/lib/actions/gamification";

type Result =
  | { error?: string; success?: string; gamification?: GamificationResult }
  | undefined;

export async function createTemptation(
  _prevState: Result,
  formData: FormData
): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const userId = session.user.id as string;

  const desc = (formData.get("desc") as string)?.trim();
  const val = parseFloat(formData.get("value") as string);
  const category = formData.get("category") as string;
  const place = ((formData.get("place") as string) ?? "").trim() || null;
  const date = formData.get("date") as string;

  if (!desc || !val || val <= 0 || !date || !category) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  // Cria o registro no banco
  await prisma.temptation.create({
    data: { userId, desc, value: val, category, place, date },
  });

  // XP baseado no valor resistido
  const xpAmount = calcTemptationXP(val);
  const { leveledUp, newLevel } = await addXP(userId, xpAmount);

  // Busca todas as tentações para verificar conquistas
  const temptations = await prisma.temptation.findMany({
    where: { userId },
    select: { id: true, date: true, value: true, category: true },
    orderBy: { date: "asc" },
  });

  const newAchievements = await checkDevilAchievements(userId, temptations);

  // Atualiza progresso de desafios de tentação da semana
  const monday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().split("T")[0];
  })();
  const today = new Date().toISOString().split("T")[0];
  const weekTemptations = temptations.filter((t) => t.date >= monday && t.date <= today);
  await updateDevilChallengeProgress(userId, weekTemptations);

  const totalResistido = temptations.reduce((s, t) => s + t.value, 0);
  const formattedTotal = totalResistido.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  revalidatePath("/");
  revalidatePath("/cofre");
  revalidatePath("/conquistas");

  return {
    success: `😈🔒 Tentação resistida! Você protegeu R$${val.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} de si mesmo. Cofre total: R$${formattedTotal}`,
    gamification: {
      xpGained: xpAmount,
      leveledUp,
      newLevelIcon: newLevel.icon,
      newLevelName: newLevel.name,
      newAchievements,
    },
  };
}

export async function deleteTemptation(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  // Verifica que a tentação pertence ao usuário antes de deletar
  const temptation = await prisma.temptation.findUnique({ where: { id } });
  if (!temptation || temptation.userId !== session.user.id) return;

  await prisma.temptation.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/cofre");
}

/** Retorna o resumo do Cofre do Diabo para o dashboard. */
export async function getCofreSummary(userId: string) {
  const temptations = await prisma.temptation.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  if (temptations.length === 0) {
    return { totalResistido: 0, count: 0, lastTemptation: null, topCategory: null };
  }

  const totalResistido = temptations.reduce((s, t) => s + t.value, 0);
  const count = temptations.length;
  const lastTemptation = temptations[0]; // já está ordenado por date desc

  // Calcula top categoria por valor total
  const catMap = new Map<string, number>();
  for (const t of temptations) {
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.value);
  }
  let topCategory: { name: string; total: number } | null = null;
  for (const [name, total] of catMap.entries()) {
    if (!topCategory || total > topCategory.total) {
      topCategory = { name, total };
    }
  }

  return { totalResistido, count, lastTemptation, topCategory };
}
