import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runGamificationCheck } from "@/lib/actions/gamification";
import { XP_LOG_EXPENSE } from "@/lib/gamification";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const body = await request.json() as { desc: string; value: number; category: string; date: string };
  const { desc, value, category, date } = body;

  if (!desc || !value || value <= 0 || !date || !category) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const monthKey = date.slice(0, 7);

  // Upsert do mês e criação da despesa (mesma lógica do saveExpense)
  const month = await prisma.month.upsert({
    where: { userId_key: { userId, key: monthKey } },
    update: {},
    create: { userId, key: monthKey },
  });

  await prisma.expense.create({
    data: { desc, value, category, date, monthId: month.id },
  });

  await runGamificationCheck(userId, XP_LOG_EXPENSE);

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/conquistas");

  return NextResponse.json({ success: true });
}
