"use client";

import { useActionState, useState } from "react";
import { useEffect, useRef } from "react";
import { saveSavings } from "@/lib/actions/savings";
import { useToast } from "@/components/ui/Toast";
import { todayDate } from "@/lib/utils";

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
  const formRef = useRef<HTMLFormElement>(null);
  // Rastreia o valor digitado para exibir mensagem motivacional em tempo real
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (state?.success) {
      showToast(state.success);
      // Limpa o formulário e o estado do valor após sucesso
      formRef.current?.reset();
      setAmount(null);
    }
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

      <form action={action} ref={formRef}>
        {/* Descrição — permite identificar cada economia individualmente */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Descrição</label>
          <input
            type="text"
            name="desc"
            placeholder="Ex: Reserva mensal, fundo de emergência..."
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Valor (R$)</label>
          <input
            type="number"
            name="value"
            placeholder="Ex: 1500"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            style={inputStyle}
            // Atualiza o estado para exibir mensagem de ofensiva em tempo real
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setAmount(isNaN(v) ? null : v);
            }}
          />
          {/* Mensagem motivacional baseada no valor — aparece assim que o usuário digita */}
          {amount !== null && amount > 0 && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4,
                background: amount >= 1
                  ? "rgba(240,140,40,0.1)"
                  : "rgba(240,96,96,0.1)",
                border: amount >= 1
                  ? "1px solid rgba(240,140,40,0.3)"
                  : "1px solid rgba(240,96,96,0.25)",
                color: amount >= 1 ? "#f08c28" : "var(--danger)",
              }}
            >
              {amount >= 1
                ? "🔥 Esse valor vai manter sua ofensiva viva! Continue guardando todo dia."
                : "⚠️ Menos de R$ 1,00 não conta para a ofensiva diária — vale a pena aumentar!"}
            </div>
          )}
        </div>

        {/* Data específica — o mês é derivado dela, permitindo múltiplos registros no mesmo mês */}
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
