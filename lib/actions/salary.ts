"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runGamificationCheck, type GamificationResult } from "@/lib/actions/gamification";
import { XP_LOG_SALARY } from "@/lib/gamification";

type Result = { error?: string; success?: string; gamification?: GamificationResult } | undefined;

export async function saveSalary(_prevState: Result, formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const val = parseFloat(formData.get("value") as string);
  const month = formData.get("month") as string;

  if (!val || val <= 0 || !month) return { error: "Preencha todos os campos" };

  const existing = await prisma.month.findUnique({
    where: { userId_key: { userId: session.user.id, key: month } },
  });

  const isUpdate = existing && existing.salary > 0;

  await prisma.month.upsert({
    where: { userId_key: { userId: session.user.id, key: month } },
    update: { salary: val },
    create: { userId: session.user.id, key: month, salary: val },
  });

  // Só ganha XP ao registrar pela primeira vez (não em atualizações)
  const gamification = !isUpdate
    ? await runGamificationCheck(session.user.id, XP_LOG_SALARY)
    : undefined;

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/meta");
  revalidatePath("/conquistas");

  return { success: isUpdate ? "✏️ Salário atualizado!" : "✅ Salário salvo!", gamification };
}

export async function deleteSalary(monthKey: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.month.updateMany({
    where: { userId: session.user.id, key: monthKey },
    data: { salary: 0 },
  });

  revalidatePath("/");
  revalidatePath("/historico");
}
