"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { error?: string; success?: string } | undefined;

export async function saveSavings(_prevState: Result, formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const val = parseFloat(formData.get("value") as string);
  const month = formData.get("month") as string;

  if (!val || val <= 0 || !month) return { error: "Preencha todos os campos" };

  await prisma.month.upsert({
    where: { userId_key: { userId: session.user.id, key: month } },
    update: { savings: val },
    create: { userId: session.user.id, key: month, savings: val },
  });

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/meta");

  return { success: "🏦 Economia registrada!" };
}

export async function deleteSavings(monthKey: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.month.updateMany({
    where: { userId: session.user.id, key: monthKey },
    data: { savings: 0 },
  });

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/meta");
}
