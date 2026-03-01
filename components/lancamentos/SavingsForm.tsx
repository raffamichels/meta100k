"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { saveSavings } from "@/lib/actions/savings";
import { useToast } from "@/components/ui/Toast";
import { thisMonth } from "@/lib/utils";

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

export function SavingsForm() {
  const { showToast } = useToast();
  const [state, action, pending] = useActionState(saveSavings, undefined);

  useEffect(() => {
    if (state?.success) showToast(state.success);
    if (state?.error) showToast(state.error);
  }, [state, showToast]);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid rgba(96,212,240,0.3)",
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
        🏦 Quanto vou guardar
      </div>

      <form action={action}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Valor guardado (R$)</label>
          <input
            type="number"
            name="value"
            placeholder="Ex: 1500"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Mês de referência</label>
          <input
            type="month"
            name="month"
            defaultValue={thisMonth()}
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
            background: "var(--accent2)",
            color: "#0a0a0f",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {pending ? "Registrando..." : "Registrar Economia"}
        </button>
      </form>
    </div>
  );
}
