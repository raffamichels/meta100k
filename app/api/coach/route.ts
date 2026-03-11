import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTipoAnalise } from "@/lib/coach";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dia = now.getDate();
  const tipoAnalise = getTipoAnalise(dia);

  // Hoje não é dia de análise
  if (!tipoAnalise) {
    return NextResponse.json({ analise: null });
  }

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      goal: true,
      baseAmount: true,
      months: {
        select: {
          key: true,
          salary: true,
          savings: true,
          expenses: { select: { value: true, category: true } },
          extras: { select: { value: true } },
        },
        orderBy: { key: "desc" },
        take: 4, // mês atual + últimos 3
      },
      budgets: { select: { category: true, limit: true, monthKey: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Chaves dos meses
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const currentMonth = user.months.find((m) => m.key === currentMonthKey);
  const prevMonth = user.months.find((m) => m.key === prevMonthKey);

  // ─── Cálculos determinísticos ───────────────────────────────────────────────
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const gastoAtual = currentMonth?.expenses.reduce((s, e) => s + e.value, 0) ?? 0;
  const gastoAnterior = prevMonth?.expenses.reduce((s, e) => s + e.value, 0) ?? 0;

  // Projeção linear: ritmo atual extrapolado para o fim do mês
  const projecao = dia > 0 ? (gastoAtual / dia) * daysInMonth : 0;

  const extrasAtual = currentMonth?.extras.reduce((s, e) => s + e.value, 0) ?? 0;
  const rendaAtual = (currentMonth?.salary ?? 0) + extrasAtual;
  const economiasAtual = currentMonth?.savings ?? 0;
  const taxaPoupanca = rendaAtual > 0 ? (economiasAtual / rendaAtual) * 100 : 0;

  const totalAcumulado = (user.baseAmount ?? 0) + user.months.reduce((s, m) => s + m.savings, 0);
  const progressoMeta = user.goal > 0 ? (totalAcumulado / user.goal) * 100 : 0;

  // Agrupamento de gastos por categoria
  const porCategoria = (currentMonth?.expenses ?? []).reduce(
    (acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.value;
      return acc;
    },
    {}
  );

  const porCategoriaAnterior = (prevMonth?.expenses ?? []).reduce(
    (acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.value;
      return acc;
    },
    {}
  );

  // Orçamentos ativos
  const activeBudgets = user.budgets.filter(
    (b) => b.monthKey === null || b.monthKey === currentMonthKey
  );
  const orcamentoTotal = activeBudgets.reduce((s, b) => s + b.limit, 0);

  const categoriasEstouradas = activeBudgets
    .filter((b) => (porCategoria[b.category] || 0) > b.limit)
    .map((b) => ({
      categoria: b.category,
      gasto: porCategoria[b.category] || 0,
      limite: b.limit,
      excesso: (porCategoria[b.category] || 0) - b.limit,
    }));

  // Histórico dos últimos meses (excluindo o mês atual)
  const historicoMeses = user.months
    .filter((m) => m.key !== currentMonthKey)
    .slice(0, 3)
    .map((m) => ({
      key: m.key,
      savings: m.savings,
      gastos: m.expenses.reduce((s, e) => s + e.value, 0),
      salary: m.salary,
    }));

  // ─── Prompt Claude ──────────────────────────────────────────────────────────
  const nomeUsuario = user.name || "usuário";

  const systemPrompt = `Você é o Coach Financeiro do META100K, um app que ajuda pessoas a economizar R$ 100.000. Fale em português brasileiro, de forma direta, encorajadora e sem julgamentos. Você é um parceiro de confiança, não um auditor. Use linguagem simples e acessível. Responda em texto corrido com parágrafos curtos — sem listas longas — como uma mensagem de um amigo que entende de finanças. Use emojis com moderação, apenas quando reforçarem o sentido. Máximo de 180 palavras.`;

  const promptsPorTipo: Record<string, string> = {
    dia8: `Hoje é o dia ${dia} do mês. Analise o início do mês de ${nomeUsuario} com base nos dados abaixo e gere um alerta precoce personalizado. Fale sobre o ritmo da primeira semana, compare com o mês anterior se houver dados, projete como o mês vai fechar e diga se está no caminho certo. Se alguma categoria estiver pesando mais, mencione diretamente pelo nome.`,
    dia15: `Hoje é o dia 15, metade do mês de ${nomeUsuario}. Analise a situação atual, compare com o mês anterior, projete como o mês vai fechar e dê uma recomendação concreta para os próximos 15 dias. Seja específico com categorias e valores — use os dados reais.`,
    dia22: `Faltam ${daysInMonth - dia} dias para fechar o mês de ${nomeUsuario}. Seja direto: diga se vai fechar no azul ou no vermelho, quanto sobra por dia, quais categorias monitorar agora. Termine com uma ação específica e possível de fazer ainda este mês.`,
    dia1: `O mês anterior de ${nomeUsuario} acabou. Faça uma retrospectiva: o que foi bem, o que pode melhorar, que padrão você identifica comparando com os meses anteriores. Depois, dê 2 sugestões concretas e personalizadas para o mês que está começando — com valores específicos quando possível. Termine perguntando se quer configurar algum orçamento novo com base na análise.`,
  };

  // ─── Dados formatados para o contexto ──────────────────────────────────────
  const categoriasLinhas = Object.entries(porCategoria)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, val]) => `  - ${cat}: R$ ${val.toFixed(2)}`)
    .join("\n") || "  Nenhum gasto registrado ainda.";

  const todasCategorias = new Set([
    ...Object.keys(porCategoria),
    ...Object.keys(porCategoriaAnterior),
  ]);

  const comparativoLinhas = [...todasCategorias]
    .map((cat) => {
      const atual = porCategoria[cat] || 0;
      const anterior = porCategoriaAnterior[cat] || 0;
      if (atual === 0 && anterior === 0) return null;
      const varNum = anterior > 0 ? (((atual - anterior) / anterior) * 100).toFixed(0) : null;
      const varStr = varNum !== null
        ? `${parseFloat(varNum) > 0 ? "+" : ""}${varNum}%`
        : "novo";
      return `  - ${cat}: R$ ${anterior.toFixed(2)} → R$ ${atual.toFixed(2)} (${varStr})`;
    })
    .filter(Boolean)
    .join("\n") || "  Sem dados do mês anterior.";

  const estouradosLinhas = categoriasEstouradas.length > 0
    ? categoriasEstouradas
        .map(
          (c) =>
            `  - ${c.categoria}: limite R$ ${c.limite.toFixed(2)}, gasto R$ ${c.gasto.toFixed(2)} (+R$ ${c.excesso.toFixed(2)})`
        )
        .join("\n")
    : "  Nenhuma categoria estourou ainda.";

  const historicoLinhas = historicoMeses.length > 0
    ? historicoMeses
        .map(
          (m) =>
            `  - ${m.key}: economizou R$ ${m.savings.toFixed(2)}, gastou R$ ${m.gastos.toFixed(2)}, salário R$ ${m.salary.toFixed(2)}`
        )
        .join("\n")
    : "  Sem histórico anterior.";

  const dadosFormatados = `DADOS DE ${nomeUsuario.toUpperCase()} — dia ${dia} de ${daysInMonth}:

Mês atual (${currentMonthKey}):
- Total gasto: R$ ${gastoAtual.toFixed(2)}
- Projeção para o fim do mês: R$ ${projecao.toFixed(2)}
- Orçamento total configurado: R$ ${orcamentoTotal.toFixed(2)}
- Renda do mês (salário + extras): R$ ${rendaAtual.toFixed(2)}
- Já economizou: R$ ${economiasAtual.toFixed(2)}
- Taxa de poupança atual: ${taxaPoupanca.toFixed(1)}%

Mês anterior (${prevMonthKey}):
- Total gasto: R$ ${gastoAnterior.toFixed(2)}

Gastos por categoria este mês:
${categoriasLinhas}

Comparativo com mês anterior:
${comparativoLinhas}

Categorias que estouraram orçamento:
${estouradosLinhas}

Progresso na meta R$ ${user.goal.toLocaleString("pt-BR")}:
- Total acumulado: R$ ${totalAcumulado.toFixed(2)} (${progressoMeta.toFixed(1)}%)

Histórico dos últimos meses:
${historicoLinhas}`;

  // ─── Chamada ao Claude API ──────────────────────────────────────────────────
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
      model: "claude-opus-4-6",
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `${promptsPorTipo[tipoAnalise]}\n\n${dadosFormatados}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Coach API error:", await response.text());
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }

  type ClaudeContent = { type: "text"; text: string } | { type: string };
  const data = (await response.json()) as { content: ClaudeContent[] };
  const textBlock = data.content.find(
    (c): c is Extract<ClaudeContent, { type: "text" }> => c.type === "text"
  );
  const analise = textBlock?.text ?? "Não foi possível gerar a análise.";

  return NextResponse.json({ analise, tipoAnalise });
}
