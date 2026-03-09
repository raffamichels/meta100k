import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmt, fmtFull, formatMonth, MONTH_NAMES } from "@/lib/utils";
import {
  calcTotalSaved,
  calcTotalEarned,
  calcTotalSpent,
  calcAvgMonthlySavings,
  calcAvgSalary,
  calcSavingsRate,
  calcProjection,
  calcAvgMonthlyExpenses,
} from "@/lib/calculations";
import { GoalConfig } from "@/components/meta/GoalConfig";
import Simulator from "@/components/meta/Simulator";

const MILESTONES = [
  { pct: 10, icon: "🌱" },
  { pct: 25, icon: "🏅" },
  { pct: 50, icon: "💰" },
  { pct: 75, icon: "🚀" },
  { pct: 90, icon: "⚡" },
  { pct: 100, icon: "👑" },
];

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
  const savingsFromMonths = user.months.reduce((a, mo) => a + (mo.savings || 0), 0);
  const totalEarned = calcTotalEarned(data);
  const totalSpent = calcTotalSpent(data);
  const avgSavings = calcAvgMonthlySavings(data);
  const avgSalary = calcAvgSalary(data);
  const avgMonthlyExpenses = calcAvgMonthlyExpenses(data);
  const savingsRate = calcSavingsRate(avgSavings, avgSalary);
  const projection = calcProjection(data);

  const pct = Math.min((totalSaved / user.goal) * 100, 100);
  const remaining = Math.max(user.goal - totalSaved, 0);
  const lastReached = [...MILESTONES].reverse().find((m) => m.pct <= pct);
  const nextMilestone = MILESTONES.find((m) => m.pct > pct);

  const savMonths = user.months
    .filter((mo) => mo.savings > 0)
    .sort((a, b) => a.key.localeCompare(b.key));

  let cumulative = user.baseAmount || 0;
  const timelineRows = savMonths.map((mo) => {
    cumulative += mo.savings;
    const rowPct = Math.min((cumulative / user.goal) * 100, 100);
    return { key: mo.key, savings: mo.savings, cumulative, pct: rowPct };
  });
  timelineRows.reverse();

  // Avaliação da taxa de poupança
  let rateColor = "var(--danger)";
  let rateLabel = "Abaixo do ideal";
  if (savingsRate >= 30) { rateColor = "#60f0a0"; rateLabel = "Excelente"; }
  else if (savingsRate >= 20) { rateColor = "var(--accent)"; rateLabel = "Muito bom"; }
  else if (savingsRate >= 10) { rateColor = "var(--gold)"; rateLabel = "Regular"; }

  const hasData = user.months.some((m) => m.salary > 0) || savMonths.length > 0;

  // Projeção
  let projDateText = "—";
  let projDetailText = "Registre economia para ver a projeção";
  if (projection.done) {
    projDateText = "🎉 Meta atingida!";
    projDetailText = `Você já acumulou ${fmt(totalSaved)}`;
  } else if (projection.months) {
    const d = projection.date;
    projDateText = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    projDetailText = `em ~${projection.months} meses guardando ${fmt(projection.avg)}/mês`;
  }

  const saldo = totalEarned - totalSpent - savingsFromMonths;

  return (
    <>
    <div className="meta-grid">

    {/* ── COLUNA ESQUERDA ── */}
    <div className="meta-left">

      {/* HERO DE PROGRESSO — tipográfico, sem card */}
      <div style={{ marginBottom: 36 }}>

        <div style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--muted)",
          marginBottom: 14,
        }}>
          Rumo aos R$ 100.000
        </div>

        {/* Número principal — display size, domina a página */}
        <div style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 62,
          fontWeight: 900,
          letterSpacing: "-3px",
          lineHeight: 1,
          color: "var(--text)",
          marginBottom: 8,
        }}>
          {fmt(totalSaved)}
        </div>

        <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>
          {remaining > 0
            ? `Faltam ${fmt(remaining)} para a meta`
            : "Meta atingida! Parabéns."}
        </div>

        {/* Barra de progresso — fina e limpa */}
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 100, height: 5, position: "relative" }}>
          <div style={{
            height: "100%",
            borderRadius: 100,
            background: "var(--accent)",
            width: `${pct}%`,
            transition: "width 0.8s ease",
          }}/>
          {/* Ponto da posição atual */}
          {pct > 0 && pct < 100 && (
            <div style={{
              position: "absolute",
              left: `${pct}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "var(--accent)",
              border: "2px solid var(--bg)",
              boxShadow: "0 0 8px rgba(200,240,96,0.6)",
            }}/>
          )}
        </div>

        {/* Legenda da barra */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          fontSize: 12,
          color: "var(--muted)",
        }}>
          <span>
            <strong style={{ color: "var(--accent)", fontFamily: "var(--font-syne)" }}>{pct.toFixed(1)}%</strong>
            {lastReached && (
              <span style={{ marginLeft: 8, opacity: 0.55 }}>{lastReached.icon}</span>
            )}
          </span>
          {nextMilestone && (
            <span style={{ opacity: 0.4, fontSize: 11 }}>
              próximo {nextMilestone.icon} {nextMilestone.pct}%
            </span>
          )}
        </div>
      </div>

      {/* DIVISOR */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 32 }}/>

      {/* 3 NÚMEROS EM LINHA — sem cards individuais, separados por divisores verticais */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 36 }}>
        {[
          { label: "Total ganho", value: fmt(totalEarned), sub: "salário + extras", color: "var(--accent)" },
          { label: "Total gasto", value: fmt(totalSpent), sub: "despesas", color: "var(--danger)" },
          { label: "Saldo livre", value: fmt(saldo), sub: "ganho − gasto", color: saldo >= 0 ? "var(--accent2)" : "var(--danger)" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              paddingLeft: i === 0 ? 0 : 20,
              paddingRight: 20,
              borderLeft: i === 0 ? "none" : "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{stat.label}</div>
            <div style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: stat.color,
              marginBottom: 4,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", opacity: 0.7 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* DIVISOR */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 28 }}/>

      {/* HISTÓRICO DE ECONOMIA — lista limpa, estilo extrato */}
      <div style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "var(--muted)",
        marginBottom: 20,
      }}>
        Histórico de economia
      </div>

      {timelineRows.length === 0 ? (
        <div style={{
          padding: "32px 0",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: 14,
          opacity: 0.6,
        }}>
          Nenhuma economia registrada ainda
        </div>
      ) : (
        <div>
          {timelineRows.map((row, i) => (
            <div
              key={row.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 0",
                borderBottom: i < timelineRows.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
              }}
            >
              {/* Dot — mais opaco para o mês mais recente */}
              <div style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent)",
                flexShrink: 0,
                opacity: i === 0 ? 1 : 0.4,
              }}/>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: i === 0 ? "var(--text)" : "var(--muted)" }}>
                  {formatMonth(row.key)}
                </div>
                {/* Mini barra do acumulado */}
                <div style={{ marginTop: 5, background: "rgba(255,255,255,0.04)", borderRadius: 100, height: 3 }}>
                  <div style={{
                    height: "100%",
                    borderRadius: 100,
                    background: "var(--accent)",
                    width: `${row.pct}%`,
                    opacity: 0.5,
                  }}/>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, opacity: 0.55 }}>
                  {fmt(row.cumulative)} acumulado · {row.pct.toFixed(1)}%
                </div>
              </div>

              {/* Valor — destaque à direita */}
              <div style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--accent)",
                flexShrink: 0,
              }}>
                +{fmt(row.savings)}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>

    {/* ── COLUNA DIREITA ── */}
    <div className="meta-right">

      {/* TAXA DE POUPANÇA — tipográfica, sem card */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--muted)",
          marginBottom: 14,
        }}>
          Taxa de poupança
        </div>

        {hasData ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
              {/* Número da taxa — mesmo peso do hero de progresso */}
              <div style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 58,
                fontWeight: 900,
                letterSpacing: "-3px",
                lineHeight: 1,
                color: rateColor,
              }}>
                {savingsRate.toFixed(1)}%
              </div>
              {/* Badge de avaliação */}
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: rateColor,
                background: `color-mix(in srgb, ${rateColor} 12%, transparent)`,
                padding: "4px 10px",
                borderRadius: 100,
                border: `1px solid color-mix(in srgb, ${rateColor} 25%, transparent)`,
                flexShrink: 0,
                alignSelf: "center",
              }}>
                {rateLabel}
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>da renda média mensal</div>
          </>
        ) : (
          <div style={{ fontSize: 14, color: "var(--muted)", paddingTop: 8, opacity: 0.6 }}>
            Registre dados para ver análise
          </div>
        )}
      </div>

      {/* DIVISOR */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 28 }}/>

      {/* MÉTRICAS — lista flat, sem cards individuais */}
      {hasData && (
        <div style={{ marginBottom: 32 }}>
          {[
            {
              label: "Salário médio",
              value: `${fmtFull(avgSalary)}/mês`,
              color: "var(--text)",
            },
            {
              label: "Economia média",
              value: `${fmtFull(avgSavings)}/mês`,
              color: "var(--accent)",
            },
            {
              label: "Falta para a meta",
              value: fmt(Math.max(user.goal - totalSaved, 0)),
              color: "var(--gold)",
            },
          ].map((item, i) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "13px 0",
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{item.label}</div>
              <div style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: item.color,
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIVISOR (só aparece se hasData) */}
      {hasData && <div style={{ height: 1, background: "var(--border)", marginBottom: 28 }}/>}

      {/* PROJEÇÃO — flat, sem card */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--muted)",
          marginBottom: 12,
        }}>
          Projeção
        </div>
        <div style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-1px",
          color: "var(--accent)",
          marginBottom: 6,
        }}>
          {projDateText}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{projDetailText}</div>
      </div>

      {/* DIVISOR */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }}/>

      {/* GOAL CONFIG */}
      <div style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "var(--muted)",
        marginBottom: 14,
      }}>
        Ajustar economia
      </div>
      <GoalConfig currentGoal={user.goal} currentBase={user.baseAmount} />

    </div>
    </div>

    {/* Simulador "E Se?" — seção abaixo, largura total no desktop */}
    <Simulator
      totalSaved={totalSaved}
      goal={user.goal}
      avgMonthlySavings={avgSavings}
      avgSalary={avgSalary}
      avgMonthlyExpenses={avgMonthlyExpenses}
    />
    </>
  );
}
