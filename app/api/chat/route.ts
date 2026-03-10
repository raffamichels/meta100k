import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcLevel } from "@/lib/gamification";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { calcDailyStreak } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

function buildFinancialContext(user: {
  name: string | null;
  email: string;
  xp: number;
  goal: number;
  baseAmount: number | null;
  maxStreak: number;
  achievements: { key: string }[];
  months: {
    key: string;
    salary: number;
    savings: number;
    expenses: { desc: string; value: number; category: string; date: string }[];
    extras: { desc: string; value: number; date: string }[];
    savingEntries: { desc: string; value: number; date: string }[];
  }[];
  budgets: { category: string; limit: number; monthKey: string | null }[];
}, totalSaved: number, goalPct: number, streak: number): string {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonth = user.months.find((m) => m.key === currentMonthKey);

  const totalExpenses = currentMonth?.expenses.reduce((a, e) => a + e.value, 0) ?? 0;
  const salary = currentMonth?.salary ?? 0;

  const expensesByCategory = currentMonth?.expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.value;
    return acc;
  }, {}) ?? {};

  const currentLevel = calcLevel(user.xp);
  const unlockedCount = user.achievements.length;
  const totalAchievements = ACHIEVEMENTS.length;

  // Orçamentos do mês atual ou recorrentes
  const activeBudgets = user.budgets.filter(
    (b) => b.monthKey === null || b.monthKey === currentMonthKey
  );
  const budgetLines = activeBudgets.map((b) => {
    const spent = expensesByCategory[b.category] ?? 0;
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    const status = pct > 100 ? "EXCEDIDO" : pct >= 80 ? "alerta" : "ok";
    return `  ${b.category}: R$${spent.toFixed(0)} / R$${b.limit.toFixed(0)} (${pct.toFixed(0)}%) — ${status}`;
  });

  const recentExpenses = (currentMonth?.expenses ?? []).slice(-5).map(
    (e) => `  - ${e.desc}: R$${e.value.toFixed(0)} (${e.category}) em ${e.date}`
  );
  const recentSavings = (currentMonth?.savingEntries ?? []).slice(-5).map(
    (s) => `  - ${s.desc}: R$${s.value.toFixed(0)} em ${s.date}`
  );

  // Histórico dos últimos 3 meses
  const lastMonths = [...user.months]
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 3)
    .map((m) => {
      const exp = m.expenses.reduce((a, e) => a + e.value, 0);
      const rate = m.salary > 0 ? ((m.savings / m.salary) * 100).toFixed(1) : "—";
      return `  ${m.key}: poupou R$${m.savings.toFixed(0)} | gastos R$${exp.toFixed(0)} | salário R$${m.salary.toFixed(0)} | taxa ${rate}%`;
    });

  return `=== CONTEXTO FINANCEIRO DO USUÁRIO (${now.toLocaleDateString("pt-BR")}) ===

PROGRESSO DA META:
  Meta: R$ ${user.goal.toLocaleString("pt-BR")}
  Total guardado: R$ ${totalSaved.toLocaleString("pt-BR")}
  Progresso: ${goalPct.toFixed(1)}%
  Falta: R$ ${Math.max(0, user.goal - totalSaved).toLocaleString("pt-BR")}

GAMIFICAÇÃO:
  Nível: ${currentLevel.level} — ${currentLevel.name} ${currentLevel.icon}
  XP total: ${user.xp.toLocaleString("pt-BR")}
  Streak atual: ${streak} dias seguidos
  Recorde de streak: ${user.maxStreak} dias
  Conquistas: ${unlockedCount} de ${totalAchievements} desbloqueadas

MÊS ATUAL (${currentMonthKey}):
  Salário/Renda: R$ ${salary.toLocaleString("pt-BR")}
  Total de gastos: R$ ${totalExpenses.toLocaleString("pt-BR")}
  Economizado: R$ ${(currentMonth?.savings ?? 0).toLocaleString("pt-BR")}
  Taxa de poupança: ${salary > 0 ? (((currentMonth?.savings ?? 0) / salary) * 100).toFixed(1) : "—"}%

GASTOS POR CATEGORIA (mês atual):
${Object.entries(expensesByCategory).map(([cat, val]) => `  ${cat}: R$${val.toFixed(0)}`).join("\n") || "  Nenhum gasto registrado"}

ORÇAMENTOS:
${budgetLines.length > 0 ? budgetLines.join("\n") : "  Nenhum orçamento definido"}

HISTÓRICO RECENTE (últimos meses):
${lastMonths.join("\n") || "  Sem histórico"}

ÚLTIMOS GASTOS:
${recentExpenses.join("\n") || "  Nenhum gasto recente"}

ÚLTIMAS ECONOMIAS:
${recentSavings.join("\n") || "  Nenhuma economia recente"}`;
}

// Tenta responder sem IA para perguntas comuns
function tryAutoAnswer(
  message: string,
  data: {
    totalSaved: number;
    goal: number;
    goalPct: number;
    streak: number;
    maxStreak: number;
    xp: number;
    level: ReturnType<typeof calcLevel>;
    unlockedCount: number;
    totalAchievements: number;
    currentMonth: {
      salary: number;
      savings: number;
      expenses: { value: number; category: string }[];
    } | undefined;
  }
): string | null {
  const msg = message.toLowerCase().trim();

  // Saldo / quanto guardei
  if (/(quanto.*guard|saldo|total.*guard|guard.*total|acumul|economiz.*total)/.test(msg)) {
    const falta = Math.max(0, data.goal - data.totalSaved);
    return `Você guardou **R$ ${data.totalSaved.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}**, que representa **${data.goalPct.toFixed(1)}%** da sua meta. Faltam **R$ ${falta.toLocaleString("pt-BR")}** para chegar em R$ ${data.goal.toLocaleString("pt-BR")}!`;
  }

  // Meta / progresso
  if (/(meta|objetivo|progresso|quanto falta|falta.*meta)/.test(msg) && !/(definir|mudar|alterar)/.test(msg)) {
    const falta = Math.max(0, data.goal - data.totalSaved);
    return `Sua meta é **R$ ${data.goal.toLocaleString("pt-BR")}** e você está em **${data.goalPct.toFixed(1)}%** — R$ ${data.totalSaved.toLocaleString("pt-BR")} guardados. Faltam **R$ ${falta.toLocaleString("pt-BR")}** para completar!`;
  }

  // Streak / sequência
  if (/(streak|dias seguidos|sequ[êe]ncia|consecutiv)/.test(msg)) {
    if (data.streak > 0) {
      return `Você está em uma sequência de **${data.streak} dia${data.streak > 1 ? "s" : ""}**! Seu recorde é de **${data.maxStreak} dias**. Continue registrando economias diariamente para manter a sequência!`;
    }
    return `Você não tem uma sequência ativa agora. Seu recorde é de **${data.maxStreak} dias**. Registre uma economia hoje para começar uma nova sequência!`;
  }

  // Nível / XP
  if (/(n[íi]vel|xp|experi[êe]ncia|level|pontua)/.test(msg)) {
    return `Você está no **Nível ${data.level.level} — ${data.level.name} ${data.level.icon}** com **${data.xp.toLocaleString("pt-BR")} XP**. Continue registrando economias e conquistando badges para subir de nível!`;
  }

  // Conquistas / badges
  if (/(conquista|badge|tro[fé][éu]u?|medalha)/.test(msg)) {
    return `Você desbloqueou **${data.unlockedCount} de ${data.totalAchievements} conquistas**. Acesse a aba de Troféus para ver todas as conquistas disponíveis e o que falta para desbloquear cada uma!`;
  }

  // Gastos do mês
  if (/(gast|despesa|gasei|gastei|quanto.*gast)/.test(msg) && /(m[êe]s|mês|atual)/.test(msg)) {
    if (!data.currentMonth) {
      return "Você não tem gastos registrados neste mês ainda.";
    }
    const total = data.currentMonth.expenses.reduce((a, e) => a + e.value, 0);
    const byCategory = data.currentMonth.expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.value;
      return acc;
    }, {});
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, val]) => `${cat}: R$${val.toFixed(0)}`)
      .join(", ");
    return `Seus gastos neste mês somam **R$ ${total.toLocaleString("pt-BR")}**. Maiores categorias: ${topCategories || "nenhuma"}. Acesse o histórico para o detalhamento completo.`;
  }

  // Taxa de poupança
  if (/(taxa|poupan[cç]a.*%|%.*poupan|porcentagem.*poupan|quanto.*poupan)/.test(msg)) {
    if (!data.currentMonth || data.currentMonth.salary <= 0) {
      return "Você ainda não registrou seu salário neste mês. Registre-o nos lançamentos para que eu possa calcular sua taxa de poupança!";
    }
    const rate = (data.currentMonth.savings / data.currentMonth.salary) * 100;
    const ideal = rate >= 20 ? "Excelente! Acima de 20% é considerado ótimo." : rate >= 10 ? "Bom! Tente chegar a 20% para resultados ainda melhores." : "Tente aumentar sua taxa de poupança para pelo menos 10% do salário.";
    return `Sua taxa de poupança este mês é de **${rate.toFixed(1)}%**. ${ideal}`;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const body = await request.json() as { messages: Message[] };
  const { messages } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      xp: true,
      goal: true,
      baseAmount: true,
      maxStreak: true,
      achievements: { select: { key: true } },
      months: {
        select: {
          key: true,
          salary: true,
          savings: true,
          expenses: { select: { desc: true, value: true, category: true, date: true } },
          extras: { select: { desc: true, value: true, date: true } },
          savingEntries: { select: { desc: true, value: true, date: true } },
        },
        orderBy: { key: "asc" },
      },
      budgets: { select: { category: true, limit: true, monthKey: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const totalSaved = (user.baseAmount ?? 0) + user.months.reduce((a, m) => a + m.savings, 0);
  const goalPct = user.goal > 0 ? Math.min((totalSaved / user.goal) * 100, 100) : 0;
  const allSavingEntries = user.months.flatMap((m) => m.savingEntries);
  const streak = calcDailyStreak(allSavingEntries);
  const currentLevel = calcLevel(user.xp);
  const unlockedCount = user.achievements.length;
  const totalAchievements = ACHIEVEMENTS.length;

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonth = user.months.find((m) => m.key === currentMonthKey);

  const lastUserMessage = messages[messages.length - 1]?.content ?? "";

  // Tenta resposta automática (sem IA)
  const autoAnswer = tryAutoAnswer(lastUserMessage, {
    totalSaved,
    goal: user.goal,
    goalPct,
    streak,
    maxStreak: user.maxStreak,
    xp: user.xp,
    level: currentLevel,
    unlockedCount,
    totalAchievements,
    currentMonth,
  });

  if (autoAnswer) {
    return NextResponse.json({ content: autoAnswer, source: "auto" });
  }

  // Fallback para Claude
  const financialContext = buildFinancialContext(user, totalSaved, goalPct, streak);

  const systemPrompt = `Você é o **Tony**, assistente financeiro do app Meta100k — um aplicativo brasileiro de economia pessoal com objetivo de ajudar o usuário a poupar R$ 100.000. Seu nome é Tony e você sempre deve se referir a si mesmo como Tony quando necessário.

Você tem acesso ao contexto financeiro completo do usuário (abaixo) e deve responder de forma personalizada, usando os dados reais.

REGRAS OBRIGATÓRIAS:
1. Responda APENAS perguntas sobre: finanças pessoais, hábitos financeiros, economia, gastos, orçamento, metas, investimentos básicos, dicas de poupança, ou sobre o próprio app Meta100k (funcionalidades, como usar, etc.).
2. Se o usuário perguntar sobre qualquer outro tema (política, esportes, culinária, programação, entretenimento, etc.), recuse EDUCADAMENTE com algo como: "Sou o Tony, especializado em finanças pessoais. Posso ajudar com dúvidas sobre sua conta, hábitos de poupança e uso do app. Tem alguma dúvida financeira?"
3. Seja conciso, direto e motivador. Use os dados reais do usuário.
4. Responda sempre em português brasileiro informal mas profissional.
5. Use markdown quando útil (negrito para valores, listas para dicas).
6. Não invente dados — use apenas o contexto fornecido.
7. Máximo de 3-4 parágrafos por resposta.

${financialContext}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    console.error("Claude API error:", await response.text());
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }

  const data = await response.json() as { content: { text: string }[] };
  const content = data.content?.[0]?.text ?? "Não consegui processar sua pergunta. Tente novamente.";

  return NextResponse.json({ content, source: "ai" });
}
