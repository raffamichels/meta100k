"use server";

import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcTotalSaved } from "@/lib/calculations";

// ─── Utilitários de data ──────────────────────────────────────────────────────

/** Retorna a data da segunda-feira da semana ANTERIOR no fuso GMT-3.
 *  Usado como chave de cache e para delimitar os dados da semana. */
function getLastMondayBR(): string {
  const nowBR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dayOffset = (nowBR.getUTCDay() + 6) % 7; // 0=Seg, 6=Dom
  const lastMonday = new Date(nowBR);
  lastMonday.setUTCDate(nowBR.getUTCDate() - dayOffset - 7);
  return lastMonday.toISOString().split("T")[0];
}

function getLastWeekBoundsBR(): { start: string; end: string } {
  const start = getLastMondayBR();
  const startDate = new Date(start + "T00:00:00Z");
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  return { start, end: endDate.toISOString().split("T")[0] };
}

// ─── Geração e cache do relatório ────────────────────────────────────────────

export async function getOrGenerateWeeklyReport(): Promise<
  { content: string } | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const userId = session.user.id as string;
  const weekKey = getLastMondayBR();

  // Retorna do cache se já foi gerado para esta semana
  const cached = await prisma.weeklyReport.findUnique({
    where: { userId_weekKey: { userId, weekKey } },
  });
  if (cached) return { content: cached.content };

  // Coleta dados do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      months: { include: { expenses: true, extras: true, savingEntries: true } },
      temptations: true,
    },
  });
  if (!user) return { error: "Usuário não encontrado" };

  const { start: wStart, end: wEnd } = getLastWeekBoundsBR();

  const allSavings    = user.months.flatMap((m) => m.savingEntries);
  const allExpenses   = user.months.flatMap((m) => m.expenses);
  const allExtras     = user.months.flatMap((m) => m.extras);

  const weekSavings     = allSavings.filter((s) => s.date >= wStart && s.date <= wEnd);
  const weekExpenses    = allExpenses.filter((e) => e.date >= wStart && e.date <= wEnd);
  const weekExtras      = allExtras.filter((e) => e.date >= wStart && e.date <= wEnd);
  const weekTemptations = user.temptations.filter((t) => t.date >= wStart && t.date <= wEnd);

  const totalSaved          = calcTotalSaved({ goal: user.goal, baseAmount: user.baseAmount, months: user.months });
  const weekSavingsTotal    = weekSavings.reduce((a, s) => a + s.value, 0);
  const weekExpensesTotal   = weekExpenses.reduce((a, e) => a + e.value, 0);
  const weekExtrasTotal     = weekExtras.reduce((a, e) => a + e.value, 0);
  const weekTemptationsTotal = weekTemptations.reduce((a, t) => a + t.value, 0);
  const savingDays          = new Set(weekSavings.map((s) => s.date)).size;
  const pct                 = ((totalSaved / user.goal) * 100).toFixed(1);

  // Top 3 categorias de gastos da semana
  const catMap = new Map<string, number>();
  for (const e of weekExpenses) {
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.value);
  }
  const topCategories = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, val]) => `${cat}: R$${Math.round(val)}`)
    .join(", ");

  const name = user.name?.split(" ")[0] ?? "você";

  const prompt = `Você é um coach financeiro pessoal apaixonado de um app chamado Meta 100K, cujo objetivo é ajudar o usuário a acumular R$100.000.

Escreva um resumo semanal narrativo para ${name}, referente à semana de ${wStart} a ${wEnd}.

Dados da semana:
- Economizado: R$${Math.round(weekSavingsTotal)} (em ${savingDays} ${savingDays === 1 ? "dia" : "dias"})
- Gastos: R$${Math.round(weekExpensesTotal)}${topCategories ? ` — categorias: ${topCategories}` : ""}
- Renda extra: R$${Math.round(weekExtrasTotal)}
- Tentações resistidas: ${weekTemptations.length}${weekTemptationsTotal > 0 ? ` (R$${Math.round(weekTemptationsTotal)} em compras evitadas)` : ""}
- Total acumulado: R$${Math.round(totalSaved)} (${pct}% da meta de R$100.000)

Instruções:
- Tom motivacional, caloroso e pessoal — use o primeiro nome "${name}"
- Máximo de 160 palavras
- Destaque 1 ponto forte e 1 área de atenção (sem ser negativo)
- Termine com uma frase de encorajamento para a semana que começa
- Português brasileiro natural
- Sem markdown, asteriscos ou formatação — apenas parágrafos corridos`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    await prisma.weeklyReport.upsert({
      where: { userId_weekKey: { userId, weekKey } },
      update: { content },
      create: { userId, weekKey, content },
    });

    return { content };
  } catch (e) {
    console.error("Erro ao gerar relatório semanal:", e);
    return { error: "Não foi possível gerar o relatório desta semana." };
  }
}
