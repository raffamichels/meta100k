"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runGamificationCheck, type GamificationResult } from "@/lib/actions/gamification";
import { XP_LOG_EXPENSE } from "@/lib/gamification";

type Result = { error?: string; success?: string; gamification?: GamificationResult } | undefined;

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

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/conquistas");

  return { success: "💸 Despesa registrada!", gamification };
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
