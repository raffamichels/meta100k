"use client";

import type { BudgetWithProgress } from "@/lib/actions/budget";

// Cores e mensagens por faixa de uso
function getBarStyle(pct: number): { color: string; label: string } {
  if (pct >= 100) return { color: "#f04040", label: "Limite ultrapassado" };
  if (pct >= 80)  return { color: "#f08020", label: "Alerta — próximo do limite" };
  if (pct >= 60)  return { color: "#f0d040", label: "Atenção — mais da metade usada" };
  return { color: "#60d060", label: "Dentro do orçamento" };
}

interface Props {
  budget: BudgetWithProgress;
  daysLeft: number;
}

export function BudgetProgressCard({ budget, daysLeft }: Props) {
  const pct = Math.min(budget.percentage, 100);
  const { color, label } = getBarStyle(budget.percentage);
  const isOver = budget.percentage >= 100;

  const fmt = (v: number) =>
    "R$ " + Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div
      style={{
        background: "var(--card)",
        border: `1px solid ${isOver ? "rgba(240,64,64,0.4)" : "var(--border)"}`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Cabeçalho: categoria + label de status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: isOver ? "#f04040" : "var(--text)",
          }}
        >
          {isOver ? "🔴 " : ""}{budget.category}
        </div>
        <div style={{ fontSize: 11, color: isOver ? "#f04040" : "var(--muted)", fontWeight: isOver ? 700 : 400 }}>
          {isOver
            ? `R$ ${Math.abs(budget.remaining).toLocaleString("pt-BR", { minimumFractionDigits: 0 })} ACIMA`
            : label}
        </div>
      </div>

      {/* Linha de valores */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{fmt(budget.spent)}</span>
          {" "}gastos de{" "}
          <span style={{ fontWeight: 600 }}>{fmt(budget.limit)}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>
          {Math.round(budget.percentage)}%
        </div>
      </div>

      {/* Barra de progresso */}
      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: 100,
          height: 8,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 100,
            background: color,
            width: `${pct}%`,
            boxShadow: `0 0 6px ${color}66`,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Rodapé: restante + dias */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
        <div>
          {isOver
            ? `Excedeu em ${fmt(Math.abs(budget.remaining))}`
            : `${fmt(budget.remaining)} restantes`}
        </div>
        <div>{daysLeft} {daysLeft === 1 ? "dia" : "dias"} até o fim do mês</div>
      </div>
    </div>
  );
}
