"use client";

import { useState } from "react";
import { formatMonth, fmt, fmtFull, formatDate, CAT_COLORS } from "@/lib/utils";
import { deleteExpense } from "@/lib/actions/expenses";
import { deleteExtra } from "@/lib/actions/extras";
import { deleteSalary } from "@/lib/actions/salary";
import { deleteSavings } from "@/lib/actions/savings";
import { useToast } from "@/components/ui/Toast";

interface Expense {
  id: string;
  desc: string;
  value: number;
  category: string;
  date: string;
}

interface Extra {
  id: string;
  desc: string;
  value: number;
  date: string;
}

interface MonthData {
  key: string;
  salary: number;
  savings: number;
  expenses: Expense[];
  extras: Extra[];
}

interface Props {
  months: MonthData[];
  initialMonth: string;
}

const btnDangerStyle: React.CSSProperties = {
  background: "rgba(240,96,96,0.15)",
  color: "var(--danger)",
  border: "1px solid rgba(240,96,96,0.3)",
  padding: "4px 8px",
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "var(--font-syne), sans-serif",
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
};

export function HistoricoClient({ months, initialMonth }: Props) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState(initialMonth);

  const monthKeys = months.map((m) => m.key);
  const mo = months.find((m) => m.key === selected) ?? {
    key: selected,
    salary: 0,
    savings: 0,
    expenses: [],
    extras: [],
  };

  const salary = mo.salary;
  const savings = mo.savings;
  const extras = mo.extras.reduce((a, e) => a + e.value, 0);
  const expenses = mo.expenses.reduce((a, e) => a + e.value, 0);
  const balance = salary + extras - expenses;

  // Category breakdown
  const catMap: Record<string, number> = {};
  mo.expenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + e.value;
  });
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  // All entries sorted by date desc
  const entries: Array<{
    id: string;
    desc: string;
    value: number;
    date: string;
    type: "expense" | "extra";
    category?: string;
  }> = [
    ...mo.expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...mo.extras.map((e) => ({ id: e.id, desc: e.desc, value: e.value, date: e.date, type: "extra" as const })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  async function handleDeleteExpense(id: string) {
    await deleteExpense(id);
    showToast("🗑️ Despesa removida");
  }

  async function handleDeleteExtra(id: string) {
    await deleteExtra(id);
    showToast("🗑️ Ganho removido");
  }

  async function handleDeleteSalary() {
    await deleteSalary(selected);
    showToast("🗑️ Salário removido");
  }

  async function handleDeleteSavings() {
    await deleteSavings(selected);
    showToast("🗑️ Economia removida");
  }

  return (
    <>
      {/* MONTH TABS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          marginBottom: 20,
          scrollbarWidth: "none",
        }}
      >
        {monthKeys.map((mk) => (
          <button
            key={mk}
            onClick={() => setSelected(mk)}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: 20,
              border: `1px solid ${mk === selected ? "var(--accent)" : "var(--border)"}`,
              background: mk === selected ? "var(--accent)" : "transparent",
              color: mk === selected ? "#0a0a0f" : "var(--muted)",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: mk === selected ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {formatMonth(mk)}
          </button>
        ))}
      </div>

      {/* MONTH SUMMARY */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Salário</div>
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, color: "var(--accent2)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {salary > 0 ? fmt(salary) : "—"}
              {salary > 0 && (
                <button style={btnDangerStyle} onClick={handleDeleteSalary}>✕</button>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Economizado</div>
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {savings > 0 ? fmt(savings) : "—"}
              {savings > 0 && (
                <button style={btnDangerStyle} onClick={handleDeleteSavings}>✕</button>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Ganhos avulsos</div>
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>{fmt(extras)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Gastos</div>
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, color: "var(--danger)" }}>{fmt(expenses)}</div>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Saldo do mês</span>
          <span style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 18, color: balance >= 0 ? "var(--success)" : "var(--danger)" }}>
            {balance >= 0 ? "+" : ""}{fmt(balance)}
          </span>
        </div>
      </div>

      {/* CATEGORY CHART */}
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
        Gastos por categoria
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
        {sortedCats.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            Sem gastos em {formatMonth(selected)}
          </div>
        ) : (
          <>
            {sortedCats.map(([cat, val], i) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{cat}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {fmtFull(val)}{" "}
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>
                      {expenses > 0 ? Math.round((val / expenses) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 100, height: 6, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 100,
                      width: `${expenses > 0 ? (val / expenses) * 100 : 0}%`,
                      background: CAT_COLORS[i % CAT_COLORS.length],
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span>Total gastos</span>
              <span style={{ color: "var(--danger)" }}>{fmtFull(expenses)}</span>
            </div>
          </>
        )}
      </div>

      {/* ENTRIES LIST */}
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
        Todos os lançamentos
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          Nenhum lançamento em {formatMonth(selected)}
        </div>
      ) : (
        entries.map((item) => (
          <div
            key={item.id}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: item.type === "expense" ? "rgba(240,96,96,0.12)" : "rgba(200,240,96,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {item.type === "expense" ? item.category?.split(" ")[0] || "💸" : "⚡"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.desc}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {item.type === "expense" ? item.category : "Ganho avulso"} · {formatDate(item.date)}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  whiteSpace: "nowrap",
                  color: item.type === "expense" ? "var(--danger)" : "var(--accent)",
                }}
              >
                {item.type === "expense" ? "-" : "+"}{fmt(item.value)}
              </div>
              <button
                style={btnDangerStyle}
                onClick={() =>
                  item.type === "expense"
                    ? handleDeleteExpense(item.id)
                    : handleDeleteExtra(item.id)
                }
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
}
