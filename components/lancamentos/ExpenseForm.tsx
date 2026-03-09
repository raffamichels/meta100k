"use client";

import { useActionState } from "react";
import { useEffect, useRef } from "react";
import { saveExpense } from "@/lib/actions/expenses";
import { useToast } from "@/components/ui/Toast";
import { useGamification } from "@/components/gamification/GamificationContext";
import { todayDate, EXPENSE_CATEGORIES } from "@/lib/utils";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "12px 14px",
  color: "var(--text)",
  fontFamily: "var(--font-dm-sans), sans-serif",
  fontSize: 15,
  outline: "none",
  WebkitAppearance: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  marginBottom: 6,
  fontWeight: 500,
};

export function ExpenseForm() {
  const { showToast } = useToast();
  const { processResult } = useGamification();
  const [state, action, pending] = useActionState(saveExpense, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      showToast(state.success);
      processResult(state.gamification);
      formRef.current?.reset();

      // Alerta de orçamento: toast secundário após o de confirmação
      if (state.budgetAlert) {
        const alert = state.budgetAlert;
        const catName = alert.category.replace(/^\S+\s/, ""); // remove emoji do prefixo
        const msg = alert.over
          ? `🔴 Você ultrapassou seu orçamento de ${catName} em R$ ${alert.overAmount?.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}.`
          : `⚠️ Você usou ${alert.percentage}% do seu orçamento de ${catName} este mês.`;
        // Exibe o alerta após o toast de confirmação
        setTimeout(() => showToast(msg), 2800);
      }
    }
    if (state?.error) showToast(state.error);
  }, [state, showToast, processResult]);

  return (
    // className="form-card expense-form-card" → mobile: botão coral (semântica de gasto)
    <div
      className="form-card expense-form-card"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(240,96,96,0.25)",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        💸 Despesa
      </div>

      <form action={action} ref={formRef}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Descrição</label>
          <input
            type="text"
            name="desc"
            placeholder="Ex: Aluguel, supermercado..."
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Valor (R$)</label>
          <input
            type="number"
            name="value"
            placeholder="Ex: 1200"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Categoria</label>
          <select
            name="category"
            style={{
              ...inputStyle,
              cursor: "pointer",
            }}
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} style={{ background: "var(--surface)" }}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Data</label>
          <input
            type="date"
            name="date"
            defaultValue={todayDate()}
            required
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 14,
            border: "none",
            background: "rgba(240,96,96,0.9)",
            color: "white",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {pending ? "Registrando..." : "Registrar Despesa"}
        </button>
      </form>
    </div>
  );
}
