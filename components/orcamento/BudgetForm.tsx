"use client";

import { useActionState, useEffect } from "react";
import { upsertBudget } from "@/lib/actions/budget";
import { EXPENSE_CATEGORIES } from "@/lib/utils";
import type { ManagedBudget } from "@/lib/actions/budget";

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

interface Props {
  currentMonthKey: string;
  // Para edição: passa o budget existente
  editing?: ManagedBudget;
  // Categorias que já têm limite recorrente (excluir do select em modo criação)
  recurringCategories: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({ currentMonthKey, editing, recurringCategories, onSuccess, onCancel }: Props) {
  const [state, action, pending] = useActionState(upsertBudget, undefined);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  // Categorias disponíveis: em modo criação, oculta as que já têm recorrente
  // Em modo edição, mostra apenas a categoria do orçamento sendo editado
  const availableCategories = editing
    ? [editing.category]
    : EXPENSE_CATEGORIES.filter((cat) => !recurringCategories.includes(cat));

  const isEditing = !!editing;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(96,212,240,0.2)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 14,
          color: "var(--accent2)",
        }}
      >
        {isEditing ? "✏️ Editar limite" : "➕ Novo limite"}
      </div>

      <form action={action}>
        {/* Campos ocultos */}
        {editing && <input type="hidden" name="budgetId" value={editing.id} />}
        <input type="hidden" name="currentMonthKey" value={currentMonthKey} />

        {/* Categoria */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Categoria</label>
          {isEditing ? (
            // Em edição, mostra a categoria como texto fixo e campo hidden
            <>
              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  color: "var(--muted)",
                  cursor: "default",
                }}
              >
                {editing.category}
              </div>
              <input type="hidden" name="category" value={editing.category} />
            </>
          ) : (
            <select name="category" style={{ ...inputStyle, cursor: "pointer" }}>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} style={{ background: "var(--surface)" }}>
                  {cat}
                </option>
              ))}
              {availableCategories.length === 0 && (
                <option value="" disabled>
                  Todas as categorias já têm limite
                </option>
              )}
            </select>
          )}
        </div>

        {/* Valor */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Limite mensal (R$)</label>
          <input
            type="number"
            name="limit"
            placeholder="Ex: 800"
            inputMode="decimal"
            min="1"
            step="0.01"
            defaultValue={editing?.limit ?? ""}
            required
            style={inputStyle}
          />
        </div>

        {/* Apenas este mês (só em criação) */}
        {!isEditing && (
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              id="onlyThisMonth"
              name="onlyThisMonth"
              value="true"
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent2)" }}
            />
            <label
              htmlFor="onlyThisMonth"
              style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer" }}
            >
              Apenas este mês (para meses atípicos)
            </label>
          </div>
        )}

        {state?.error && (
          <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10 }}>
            {state.error}
          </div>
        )}

        {/* Botões */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={pending || (!isEditing && availableCategories.length === 0)}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 12,
              border: "none",
              background: "rgba(96,212,240,0.85)",
              color: "#0a0a0f",
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "11px 20px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--muted)",
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
