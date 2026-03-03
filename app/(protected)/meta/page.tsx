import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmt, fmtFull, formatMonth } from "@/lib/utils";
import {
  calcTotalSaved,
  calcTotalEarned,
  calcTotalSpent,
  calcAvgMonthlySavings,
  calcAvgSalary,
  calcSavingsRate,
  calcProjection,
} from "@/lib/calculations";
import { GoalConfig } from "@/components/meta/GoalConfig";

export default async function MetaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { months: { include: { expenses: true, extras: true } } },
  });

  if (!user) redirect("/login");

  const data = { goal: user.goal, baseAmount: user.baseAmount, months: user.months };

  const totalSaved = calcTotalSaved(data);
  const totalEarned = calcTotalEarned(data);
  const totalSpent = calcTotalSpent(data);
  const avgSavings = calcAvgMonthlySavings(data);
  const avgSalary = calcAvgSalary(data);
  const savingsRate = calcSavingsRate(avgSavings, avgSalary);
  const projection = calcProjection(data);

  // Savings timeline sorted oldest→newest for cumulative, then reversed for display
  const savMonths = user.months
    .filter((mo) => mo.savings > 0)
    .sort((a, b) => a.key.localeCompare(b.key));

  let cumulative = user.baseAmount || 0;
  const timelineRows = savMonths.map((mo) => {
    cumulative += mo.savings;
    const pct = Math.min((cumulative / user.goal) * 100, 100);
    return { key: mo.key, savings: mo.savings, cumulative, pct };
  });
  timelineRows.reverse(); // show newest first

  // Analysis colors
  let rateColor = "var(--danger)";
  let rateMsg = "Abaixo do ideal";
  if (savingsRate >= 30) { rateColor = "var(--success)"; rateMsg = "Excelente!"; }
  else if (savingsRate >= 20) { rateColor = "var(--accent)"; rateMsg = "Muito bom"; }
  else if (savingsRate >= 10) { rateColor = "var(--gold)"; rateMsg = "Regular"; }

  const hasData = user.months.some((m) => m.salary > 0) || savMonths.length > 0;

  const projectionText = projection.done
    ? "Meta atingida! 🎉"
    : projection.months
    ? `em ~${projection.months} meses`
    : "sem projeção";

  return (
    // .meta-grid → no desktop: grid 2 colunas (3fr dados | 2fr análise+config)
    // No mobile: div transparente, tudo empilhado normalmente
    <div className="meta-grid">

    {/* COLUNA ESQUERDA: visão macro — total guardado, ganhos/gastos, timeline */}
    <div className="meta-left">

      {/* TOTAL SAVED HERO */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(96,212,240,0.12), rgba(200,240,96,0.08))",
          border: "1px solid rgba(96,212,240,0.25)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--muted)" }}>
          💰 Total economizado
        </div>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-2px",
            color: "var(--accent2)",
            margin: "8px 0",
          }}
        >
          {fmt(totalSaved)}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Meta: <strong style={{ color: "var(--accent)" }}>R$ {user.goal.toLocaleString("pt-BR")}</strong>
        </div>
      </div>

      {/* CONSOLIDATED EARNINGS */}
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--muted)",
          marginBottom: 14,
          marginTop: 24,
        }}
      >
        Painel consolidado de ganhos
      </div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "rgba(200,240,96,0.06)", border: "1px solid rgba(200,240,96,0.15)", borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Total ganho</div>
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 20, fontWeight: 800, color: "var(--accent)", marginTop: 4 }}>{fmt(totalEarned)}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>salário + extras</div>
          </div>
          <div style={{ background: "rgba(240,96,96,0.06)", border: "1px solid rgba(240,96,96,0.15)", borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Total gasto</div>
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 20, fontWeight: 800, color: "var(--danger)", marginTop: 4 }}>{fmt(totalSpent)}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>todas as despesas</div>
          </div>
        </div>
        <div style={{ background: "rgba(96,212,240,0.06)", border: "1px solid rgba(96,212,240,0.15)", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Saldo histórico (ganho − gasto)</div>
          <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 24, fontWeight: 800, color: "var(--accent2)", marginTop: 4 }}>{fmt(totalEarned - totalSpent)}</div>
        </div>
      </div>

      {/* SAVINGS TIMELINE */}
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--muted)",
          marginBottom: 14,
          marginTop: 24,
        }}
      >
        Histórico de economia
      </div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        {timelineRows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏦</div>
            Nenhuma economia registrada ainda
          </div>
        ) : (
          timelineRows.map((row) => (
            <div
              key={row.key}
              style={{
                display: "flex",
                gap: 14,
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  flexShrink: 0,
                  marginTop: 5,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {formatMonth(row.key)}{" "}
                  <span style={{ color: "var(--accent)" }}>+{fmt(row.savings)}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Acumulado: {fmt(row.cumulative)} · {row.pct.toFixed(1)}% da meta
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div> {/* fim .meta-left */}

    {/* COLUNA DIREITA: análise financeira + configuração da meta */}
    <div className="meta-right">

      {/* ANALYSIS */}
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--muted)",
          marginBottom: 14,
          marginTop: 24,
        }}
      >
        Análise financeira
      </div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        {!hasData ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            Registre dados para ver análise
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Taxa de poupança</div>
                <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 28, fontWeight: 800, color: rateColor }}>{savingsRate.toFixed(1)}%</div>
              </div>
              <div
                style={{
                  background: `rgba(${savingsRate >= 30 ? "96,240,160" : savingsRate >= 20 ? "200,240,96" : savingsRate >= 10 ? "240,192,96" : "240,96,96"},0.15)`,
                  color: rateColor,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 20,
                  display: "inline-block",
                }}
              >
                {rateMsg}
              </div>
            </div>

            <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />

            {[
              { dot: "var(--accent2)", title: "Salário médio", value: `${fmtFull(avgSalary)}/mês` },
              { dot: "var(--accent)", title: "Economia média", value: `${fmtFull(avgSavings)}/mês` },
              {
                dot: "var(--gold)",
                title: "Faltam para a meta",
                value: `${fmt(Math.max(user.goal - totalSaved, 0))} · ${projectionText}`,
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: item.dot,
                    flexShrink: 0,
                    marginTop: 5,
                  }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* GOAL CONFIG */}
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--muted)",
          marginBottom: 14,
          marginTop: 24,
        }}
      >
        Ajustar economia
      </div>
      <GoalConfig currentGoal={user.goal} currentBase={user.baseAmount} />

    </div> {/* fim .meta-right */}
    </div>
  );
}
