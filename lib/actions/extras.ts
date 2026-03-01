"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { error?: string; success?: string } | undefined;

export async function saveExtra(_prevState: Result, formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const desc = (formData.get("desc") as string)?.trim();
  const val = parseFloat(formData.get("value") as string);
  const date = formData.get("date") as string;

  if (!desc || !val || val <= 0 || !date) {
    return { error: "Preencha todos os campos corretamente" };
  }

  const monthKey = date.slice(0, 7);

  const month = await prisma.month.upsert({
    where: { userId_key: { userId: session.user.id, key: monthKey } },
    update: {},
    create: { userId: session.user.id, key: monthKey },
  });

  await prisma.extra.create({
    data: { desc, value: val, date, monthId: month.id },
  });

  revalidatePath("/");
  revalidatePath("/historico");

  return { success: "⚡ Ganho adicionado!" };
}

export async function deleteExtra(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const extra = await prisma.extra.findUnique({
    where: { id },
    include: { month: true },
  });

  if (!extra || extra.month.userId !== session.user.id) return;

  await prisma.extra.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/historico");
}
