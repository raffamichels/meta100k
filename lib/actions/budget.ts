"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENT_MAP } from "@/lib/achievements";

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type BudgetWithProgress = {
  id: string;
  category: string;
  limit: number;
  monthKey: string | null;
  spent: number;
  percentage: number;
  remaining: number;
};

export type ManagedBudget = {
  id: string;
  category: string;
  limit: number;
  monthKey: string | null;
};

// ─── Helper: unlock de conquista de orçamento ─────────────────────────────────

async function tryUnlockBudget(userId: string, key: string): Promise<void> {
  const def = ACHIEVEMENT_MAP.get(key);
  if (!def) return;
  try {
    await prisma.userAchievement.create({ data: { userId, key } });
    if (def.xpReward > 0) {
      await prisma.user.update({ where: { id: userId }, data: { xp: { increment: def.xpReward } } });
    }
  } catch {
    // already exists (unique constraint)
  }
}

// ─── Helper: mês anterior no formato YYYY-MM ──────────────────────────────────

function prevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

// ─── Buscar orçamentos ativos do mês + todos os orçamentos para gestão ────────

export async function getBudgets(monthKey: string): Promise<{
  activeBudgets: BudgetWithProgress[];
  managedBudgets: ManagedBudget[];
}> {
  const session = await auth();
  if (!session?.user?.id) return { activeBudgets: [], managedBudgets: [] };
  const userId = session.user.id;

  // Carrega todos os orçamentos do usuário
  const allBudgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { category: "asc" },
  });

  // Carrega despesas do mês atual
  const month = await prisma.month.findUnique({
    where: { userId_key: { userId, key: monthKey } },
    include: { expenses: true },
  });

  // Resolve orçamento ativo por categoria (específico tem prioridade sobre recorrente)
  const categoryMap = new Map<string, typeof allBudgets[0]>();
  // 1º pass: recorrentes
  for (const b of allBudgets) {
    if (b.monthKey === null) categoryMap.set(b.category, b);
  }
  // 2º pass: específicos sobrescrevem recorrentes
  for (const b of allBudgets) {
    if (b.monthKey === monthKey) categoryMap.set(b.category, b);
  }

  // Calcula progresso para cada orçamento ativo
  const activeBudgets: BudgetWithProgress[] = [];
  for (const [, budget] of categoryMap) {
    const spent = (month?.expenses ?? [])
      .filter((e) => e.category === budget.category)
      .reduce((s, e) => s + e.value, 0);
    activeBudgets.push({
      id: budget.id,
      category: budget.category,
      limit: budget.limit,
      monthKey: budget.monthKey,
      spent,
      percentage: budget.limit > 0 ? (spent / budget.limit) * 100 : 0,
      remaining: budget.limit - spent,
    });
  }
  activeBudgets.sort((a, b) => a.category.localeCompare(b.category));

  // Verifica conquistas de fim-de-mês com dados do mês anterior
  await checkMonthEndAchievements(userId, monthKey, allBudgets);

  return {
    activeBudgets,
    managedBudgets: allBudgets.map((b) => ({
      id: b.id,
      category: b.category,
      limit: b.limit,
      monthKey: b.monthKey,
    })),
  };
}

// ─── Verifica conquistas de fim de mês (mês anterior) ─────────────────────────

async function checkMonthEndAchievements(
  userId: string,
  currentMonthKey: string,
  allBudgets: { category: string; limit: number; monthKey: string | null }[]
) {
  if (allBudgets.length === 0) return;

  const prev = prevMonthKey(currentMonthKey);
  const prevMonth = await prisma.month.findUnique({
    where: { userId_key: { userId, key: prev } },
    include: { expenses: true },
  });
  if (!prevMonth) return;

  // Resolve orçamentos ativos no mês anterior
  const prevMap = new Map<string, { limit: number }>();
  for (const b of allBudgets) {
    if (b.monthKey === null) prevMap.set(b.category, { limit: b.limit });
  }
  for (const b of allBudgets) {
    if (b.monthKey === prev) prevMap.set(b.category, { limit: b.limit });
  }
  if (prevMap.size === 0) return;

  // Calcula gasto por categoria no mês anterior
  const spentMap = new Map<string, number>();
  for (const e of prevMonth.expenses) {
    spentMap.set(e.category, (spentMap.get(e.category) ?? 0) + e.value);
  }

  // budget_perfect_month: todas as categorias com orçamento ficaram dentro do limite
  let allWithinLimit = true;
  let anyUnder50 = false;
  for (const [cat, { limit }] of prevMap) {
    const spent = spentMap.get(cat) ?? 0;
    if (spent > limit) allWithinLimit = false;
    if (limit > 0 && spent / limit < 0.5) anyUnder50 = true;
  }
  if (allWithinLimit) await tryUnlockBudget(userId, "budget_perfect_month");

  // budget_under_50: usou menos de 50% em alguma categoria
  if (anyUnder50) await tryUnlockBudget(userId, "budget_under_50");

  // budget_perfect_3: 3 meses consecutivos perfeitos (verifica os 3 meses anteriores ao atual)
  const m2 = prevMonthKey(prev);
  const m3 = prevMonthKey(m2);
  const [m2Data, m3Data] = await Promise.all([
    prisma.month.findUnique({ where: { userId_key: { userId, key: m2 } }, include: { expenses: true } }),
    prisma.month.findUnique({ where: { userId_key: { userId, key: m3 } }, include: { expenses: true } }),
  ]);
  if (m2Data && m3Data && allWithinLimit) {
    // Verifica m2 e m3 individualmente
    const checkMonthPerfect = (expenses: { category: string; value: number }[]) => {
      const sm = new Map<string, number>();
      for (const e of expenses) sm.set(e.category, (sm.get(e.category) ?? 0) + e.value);
      for (const [cat, { limit }] of prevMap) {
        if ((sm.get(cat) ?? 0) > limit) return false;
      }
      return true;
    };
    if (checkMonthPerfect(m2Data.expenses) && checkMonthPerfect(m3Data.expenses)) {
      await tryUnlockBudget(userId, "budget_perfect_3");
    }
  }
}

// ─── Criar ou atualizar um orçamento ─────────────────────────────────────────

type UpsertResult = { error?: string; success?: string } | undefined;

export async function upsertBudget(_prevState: UpsertResult, formData: FormData): Promise<UpsertResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };
  const userId = session.user.id;

  const budgetId = formData.get("budgetId") as string | null;
  const category = formData.get("category") as string;
  const limit = parseFloat(formData.get("limit") as string);
  const onlyThisMonth = formData.get("onlyThisMonth") === "true";
  const currentMonthKey = formData.get("currentMonthKey") as string;

  if (!category || !limit || limit <= 0) {
    return { error: "Preencha a categoria e o valor corretamente" };
  }

  // monthKey: null = recorrente, "YYYY-MM" = específico
  const monthKey = onlyThisMonth ? currentMonthKey : null;

  if (budgetId) {
    // Editar existente
    const existing = await prisma.budget.findUnique({ where: { id: budgetId } });
    if (!existing || existing.userId !== userId) return { error: "Orçamento não encontrado" };

    await prisma.budget.update({
      where: { id: budgetId },
      data: { limit },
    });
  } else {
    // Criar novo (upsert por category+monthKey)
    const existing = await prisma.budget.findFirst({
      where: { userId, category, monthKey },
    });

    if (existing) {
      await prisma.budget.update({ where: { id: existing.id }, data: { limit } });
    } else {
      await prisma.budget.create({ data: { userId, category, limit, monthKey } });
    }

    // Verifica conquistas após criar
    const count = await prisma.budget.count({ where: { userId } });
    if (count >= 1) await tryUnlockBudget(userId, "budget_first");

    const cats = await prisma.budget.findMany({
      where: { userId },
      select: { category: true },
      distinct: ["category"],
    });
    if (cats.length >= 5) await tryUnlockBudget(userId, "budget_five_categories");
  }

  revalidatePath("/orcamento");
  return { success: "Orçamento salvo!" };
}

// ─── Excluir um orçamento ─────────────────────────────────────────────────────

export async function deleteBudget(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) return;

  await prisma.budget.delete({ where: { id } });
  revalidatePath("/orcamento");
}

// ─── Buscar orçamento ativo para uma categoria/mês (usado em expenses.ts) ─────

export async function getActiveBudget(
  userId: string,
  category: string,
  monthKey: string
): Promise<{ id: string; limit: number } | null> {
  // Primeiro tenta específico do mês, depois recorrente
  const specific = await prisma.budget.findFirst({
    where: { userId, category, monthKey },
  });
  if (specific) return { id: specific.id, limit: specific.limit };

  const recurring = await prisma.budget.findFirst({
    where: { userId, category, monthKey: null },
  });
  return recurring ? { id: recurring.id, limit: recurring.limit } : null;
}
