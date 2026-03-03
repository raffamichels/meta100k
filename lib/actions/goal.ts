"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { error?: string; success?: string } | undefined;

export async function updateGoal(_prevState: Result, formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  // Apenas o baseAmount é editável — o valor da meta não pode ser alterado
  const base = parseFloat(formData.get("baseAmount") as string) || 0;

  if (base < 0) return { error: "Valor inválido" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { baseAmount: base },
  });

  revalidatePath("/");
  revalidatePath("/meta");

  return { success: "💰 Economia atualizada!" };
}
