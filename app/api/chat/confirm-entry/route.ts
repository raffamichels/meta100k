import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runGamificationCheck } from "@/lib/actions/gamification";
import { addXP, calcTemptationXP, XP_LOG_EXPENSE, XP_LOG_SALARY, XP_LOG_EXTRA, XP_SAVE_ANY, XP_SAVE_100, XP_SAVE_1000 } from "@/lib/gamification";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const body = await request.json() as Record<string, unknown>;
  const { type } = body;

  switch (type) {

    // ── Despesa ──────────────────────────────────────────────────────────────
    case "expense": {
      const { desc, value, category, date } = body as { desc: string; value: number; category: string; date: string };
      if (!desc || !value || value <= 0 || !date || !category)
        return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

      const monthKey = date.slice(0, 7);
      const month = await prisma.month.upsert({
        where: { userId_key: { userId, key: monthKey } },
        update: {},
        create: { userId, key: monthKey },
      });
      await prisma.expense.create({ data: { desc, value, category, date, monthId: month.id } });
      await runGamificationCheck(userId, XP_LOG_EXPENSE);
      revalidatePath("/"); revalidatePath("/historico"); revalidatePath("/conquistas");
      return NextResponse.json({ success: true });
    }

    // ── Salário ──────────────────────────────────────────────────────────────
    case "salary": {
      const { value, month: monthKey } = body as { value: number; month: string };
      if (!value || value <= 0 || !monthKey)
        return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

      const existing = await prisma.month.findUnique({
        where: { userId_key: { userId, key: monthKey } },
      });
      const isUpdate = existing && existing.salary > 0;

      await prisma.month.upsert({
        where: { userId_key: { userId, key: monthKey } },
        update: { salary: value },
        create: { userId, key: monthKey, salary: value },
      });

      // XP apenas no primeiro registro (não em atualizações)
      if (!isUpdate) await runGamificationCheck(userId, XP_LOG_SALARY);
      revalidatePath("/"); revalidatePath("/historico"); revalidatePath("/meta"); revalidatePath("/conquistas");
      return NextResponse.json({ success: true });
    }

    // ── Economia ─────────────────────────────────────────────────────────────
    case "savings": {
      const { desc, value, date } = body as { desc: string; value: number; date: string };
      if (!desc || !value || value <= 0 || !date)
        return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

      const monthKey = date.slice(0, 7);
      const month = await prisma.month.upsert({
        where: { userId_key: { userId, key: monthKey } },
        update: {},
        create: { userId, key: monthKey },
      });
      await prisma.saving.create({ data: { desc, value, date, monthId: month.id } });

      // Recalcula total do mês (mesma lógica da server action original)
      const all = await prisma.saving.findMany({ where: { monthId: month.id } });
      const total = all.reduce((a, s) => a + s.value, 0);
      await prisma.month.update({ where: { id: month.id }, data: { savings: total } });

      const xpAmount = value >= 1000 ? XP_SAVE_ANY + XP_SAVE_1000
                     : value >= 100  ? XP_SAVE_ANY + XP_SAVE_100
                     : XP_SAVE_ANY;
      await runGamificationCheck(userId, xpAmount);
      revalidatePath("/"); revalidatePath("/historico"); revalidatePath("/meta"); revalidatePath("/conquistas");
      return NextResponse.json({ success: true });
    }

    // ── Ganho avulso ─────────────────────────────────────────────────────────
    case "extra": {
      const { desc, value, date } = body as { desc: string; value: number; date: string };
      if (!desc || !value || value <= 0 || !date)
        return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

      const monthKey = date.slice(0, 7);
      const month = await prisma.month.upsert({
        where: { userId_key: { userId, key: monthKey } },
        update: {},
        create: { userId, key: monthKey },
      });
      await prisma.extra.create({ data: { desc, value, date, monthId: month.id } });
      await runGamificationCheck(userId, XP_LOG_EXTRA);
      revalidatePath("/"); revalidatePath("/historico"); revalidatePath("/conquistas");
      return NextResponse.json({ success: true });
    }

    // ── Cofre do Diabo (tentação resistida) ──────────────────────────────────
    case "temptation": {
      const { desc, value, category, place, date } = body as {
        desc: string; value: number; category: string; place?: string; date: string;
      };
      if (!desc || !value || value <= 0 || !category || !date)
        return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

      await prisma.temptation.create({
        data: { userId, desc, value, category, place: place || null, date },
      });

      const xpAmount = calcTemptationXP(value);
      await addXP(userId, xpAmount);
      revalidatePath("/"); revalidatePath("/cofre"); revalidatePath("/conquistas");
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Tipo de lançamento inválido" }, { status: 400 });
  }
}
