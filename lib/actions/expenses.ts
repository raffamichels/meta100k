"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runGamificationCheck, type GamificationResult } from "@/lib/actions/gamification";
import { XP_LOG_EXPENSE } from "@/lib/gamification";
import { getActiveBudget } from "@/lib/actions/budget";

export type BudgetAlert = {
  category: string;
  percentage: number;
  over: boolean;
  overAmount: number | null;
};

type Result = { error?: string; success?: string; gamification?: GamificationResult; budgetAlert?: BudgetAlert | null } | undefined;

export async function saveExpense(_prevState: Result, formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const desc = (formData.get("desc") as string)?.trim();
  const val = parseFloat(formData.get("value") as string);
  const category = formData.get("category") as string;
  const date = formData.get("date") as string;

  if (!desc || !val || val <= 0 || !date || !category) {
    return { error: "Preencha todos os campos corretamente" };
  }

  const monthKey = date.slice(0, 7);

  const month = await prisma.month.upsert({
    where: { userId_key: { userId: session.user.id, key: monthKey } },
    update: {},
    create: { userId: session.user.id, key: monthKey },
  });

  await prisma.expense.create({
    data: { desc, value: val, category, date, monthId: month.id },
  });

  const gamification = await runGamificationCheck(session.user.id, XP_LOG_EXPENSE);

  // Verifica alerta de orçamento para a categoria lançada
  let budgetAlert: BudgetAlert | null = null;
  const activeBudget = await getActiveBudget(session.user.id, category, monthKey);
  if (activeBudget) {
    const monthRecord = await prisma.month.findUnique({
      where: { userId_key: { userId: session.user.id, key: monthKey } },
    });
    if (monthRecord) {
      const expenses = await prisma.expense.findMany({
        where: { monthId: monthRecord.id, category },
      });
      const totalSpent = expenses.reduce((s, e) => s + e.value, 0);
      const pct = totalSpent / activeBudget.limit;
      if (pct >= 0.8) {
        budgetAlert = {
          category,
          percentage: Math.round(pct * 100),
          over: pct >= 1,
          overAmount: pct >= 1 ? totalSpent - activeBudget.limit : null,
        };
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/conquistas");

  return { success: "💸 Despesa registrada!", gamification, budgetAlert };
}

export async function deleteExpense(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { month: true },
  });

  if (!expense || expense.month.userId !== session.user.id) return;

  await prisma.expense.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/historico");
}
