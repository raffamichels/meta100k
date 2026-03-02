"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { error?: string; success?: string } | undefined;

export async function saveSavings(_prevState: Result, formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const desc = (formData.get("desc") as string)?.trim();
  const val = parseFloat(formData.get("value") as string);
  const date = formData.get("date") as string;

  if (!desc || !val || val <= 0 || !date) {
    return { error: "Preencha todos os campos corretamente" };
  }

  // Deriva o mês da data escolhida (ex: "2026-03-10" → "2026-03")
  const monthKey = date.slice(0, 7);

  // Garante que o mês existe no banco
  const month = await prisma.month.upsert({
    where: { userId_key: { userId: session.user.id, key: monthKey } },
    update: {},
    create: { userId: session.user.id, key: monthKey },
  });

  // Cria o registro individual de economia
  await prisma.saving.create({
    data: { desc, value: val, date, monthId: month.id },
  });

  // Recalcula e atualiza o total do mês (campo savings = soma dos registros)
  const all = await prisma.saving.findMany({ where: { monthId: month.id } });
  const total = all.reduce((a, s) => a + s.value, 0);

  await prisma.month.update({
    where: { id: month.id },
    data: { savings: total },
  });

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/meta");

  return { success: "🏦 Economia registrada!" };
}

export async function deleteSavings(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  // Verifica posse antes de deletar
  const saving = await prisma.saving.findUnique({
    where: { id },
    include: { month: true },
  });

  if (!saving || saving.month.userId !== session.user.id) return;

  await prisma.saving.delete({ where: { id } });

  // Recalcula o total do mês após a remoção
  const all = await prisma.saving.findMany({ where: { monthId: saving.monthId } });
  const total = all.reduce((a, s) => a + s.value, 0);

  await prisma.month.update({
    where: { id: saving.monthId },
    data: { savings: total },
  });

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/meta");
}
