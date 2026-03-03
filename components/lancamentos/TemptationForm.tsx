"use client";

import { useActionState } from "react";
import { useEffect, useRef } from "react";
import { createTemptation } from "@/lib/actions/temptations";
import { useToast } from "@/components/ui/Toast";
import { useGamification } from "@/components/gamification/GamificationContext";
import { todayDate, TEMPTATION_CATEGORIES } from "@/lib/utils";

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

export function TemptationForm() {
  const { showToast } = useToast();
  const { processResult } = useGamification();
  const [state, action, pending] = useActionState(createTemptation, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      showToast(state.success);
      processResult(state.gamification);
      formRef.current?.reset();
    }
    if (state?.error) showToast(state.error);
  }, [state, showToast, processResult]);

  return (
    <div
      style={{
        background: "var(--card)",
        // Borda com cor temática do Cofre do Diabo (roxo avermelhado)
        border: "1px solid rgba(180,60,240,0.35)",
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
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        😈 Cofre do Diabo
      </div>

      {/* Subtítulo explicativo */}
      <div
        style={{
          fontSize: 12,
          color: "var(--muted)",
          marginBottom: 16,
          lineHeight: 1.4,
        }}
      >
        Registre uma compra que quase fez mas resistiu.
      </div>

      <form action={action} ref={formRef}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>O que era?</label>
          <input
            type="text"
            name="desc"
            placeholder='Ex: "Tênis Nike", "iPhone 15"...'
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Valor que teria gasto (R$)</label>
          <input
            type="number"
            name="value"
            placeholder="Ex: 350"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Categoria</label>
          <select name="category" style={{ ...inputStyle, cursor: "pointer" }}>
            {TEMPTATION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} style={{ background: "var(--surface)" }}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Onde quase comprou? (opcional)</label>
          <input
            type="text"
            name="place"
            placeholder='Ex: "Shopping Iguatemi", "Amazon"...'
            style={inputStyle}
          />
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
            // Gradiente temático do Cofre do Diabo
            background: "linear-gradient(135deg, rgba(180,60,240,0.85), rgba(120,40,200,0.9))",
            color: "white",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {pending ? "Registrando..." : "😈 Guardar no Cofre"}
        </button>
      </form>
    </div>
  );
}
