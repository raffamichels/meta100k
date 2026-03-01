"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { error?: string; success?: string } | undefined;

export async function updateGoal(_prevState: Result, formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const goal = parseFloat(formData.get("goal") as string);
  const base = parseFloat(formData.get("baseAmount") as string) || 0;

  if (!goal || goal <= 0) return { error: "Meta inválida" };
  if (base < 0) return { error: "Valor inicial inválido" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { goal, baseAmount: base },
  });

  revalidatePath("/");
  revalidatePath("/meta");

  return { success: "🎯 Meta atualizada!" };
}
