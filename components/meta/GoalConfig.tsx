"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { updateGoal } from "@/lib/actions/goal";
import { useToast } from "@/components/ui/Toast";

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
  currentGoal: number;
  currentBase: number;
}

export function GoalConfig({ currentGoal, currentBase }: Props) {
  const { showToast } = useToast();
  const [state, action, pending] = useActionState(updateGoal, undefined);

  useEffect(() => {
    if (state?.success) showToast(state.success);
    if (state?.error) showToast(state.error);
  }, [state, showToast]);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: 20,
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
        🎯 Sua Meta
      </div>

      {/* Meta fixa — apenas exibição, não pode ser alterada */}
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>Valor da meta (R$)</div>
        <div
          style={{
            ...inputStyle,
            color: "var(--muted)",
            cursor: "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>R$ {currentGoal.toLocaleString("pt-BR")}</span>
          <span style={{ fontSize: 11, letterSpacing: "0.5px", opacity: 0.5 }}>fixo</span>
        </div>
      </div>

      <form action={action}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Economia já acumulada (R$)</label>
          <input
            type="number"
            name="baseAmount"
            defaultValue={currentBase}
            min="0"
            step="0.01"
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
            background: "var(--accent)",
            color: "#0a0a0f",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {pending ? "Atualizando..." : "Atualizar Economia"}
        </button>
      </form>
    </div>
  );
}
