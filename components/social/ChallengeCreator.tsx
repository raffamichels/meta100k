"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSocialChallenge } from "@/lib/actions/social";

export function ChallengeCreator() {
  const [mode, setMode] = useState<"hard" | "savings">("hard");
  const [days, setDays] = useState<30 | 60 | 90>(30);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createSocialChallenge(mode, mode === "savings" ? days : undefined);
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        setCreatedId(result.id);
        router.refresh();
      }
    });
  }

  function handleCopy() {
    if (!createdId) return;
    const url = `${window.location.origin}/desafio/${createdId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (createdId) {
    const shareUrl = `/desafio/${createdId}`;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Sucesso */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(200,240,96,0.12), rgba(96,212,240,0.08))",
            border: "1px solid rgba(200,240,96,0.3)",
            borderRadius: 20,
            padding: "24px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 8,
              color: "var(--accent)",
            }}
          >
            Desafio criado!
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
            Compartilhe o link abaixo com seu amigo para começar a batalha.
          </div>

          {/* Link para copiar */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: "var(--muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "monospace",
              }}
            >
              {typeof window !== "undefined" ? `${window.location.origin}${shareUrl}` : shareUrl}
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? "var(--accent)" : "rgba(200,240,96,0.12)",
                border: "1px solid rgba(200,240,96,0.3)",
                borderRadius: 8,
                padding: "6px 14px",
                color: copied ? "#0a0a0f" : "var(--accent)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              {copied ? "✓ Copiado!" : "Copiar"}
            </button>
          </div>

          {/* Ir para o desafio */}
          <a
            href={shareUrl}
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              color: "#0a0a0f",
              fontWeight: 800,
              fontSize: 14,
              borderRadius: 12,
              padding: "12px 28px",
              textDecoration: "none",
            }}
          >
            Ver Desafio →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Seleção de modo */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: 10,
          }}
        >
          Modo do Desafio
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          {/* Hard Mode */}
          <button
            onClick={() => setMode("hard")}
            style={{
              background: mode === "hard"
                ? "linear-gradient(135deg, rgba(240,96,160,0.18), rgba(160,96,240,0.12))"
                : "rgba(255,255,255,0.03)",
              border: mode === "hard"
                ? "2px solid rgba(240,96,160,0.6)"
                : "2px solid var(--border)",
              borderRadius: 16,
              padding: "18px 14px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏁</div>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: mode === "hard" ? "#f060a0" : "var(--foreground)",
                marginBottom: 4,
              }}
            >
              Hard Mode
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
              Corrida para R$100K — quem chegar primeiro vence!
            </div>
          </button>

          {/* Savings Mode */}
          <button
            onClick={() => setMode("savings")}
            style={{
              background: mode === "savings"
                ? "linear-gradient(135deg, rgba(96,212,240,0.15), rgba(200,240,96,0.08))"
                : "rgba(255,255,255,0.03)",
              border: mode === "savings"
                ? "2px solid rgba(96,212,240,0.6)"
                : "2px solid var(--border)",
              borderRadius: 16,
              padding: "18px 14px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: mode === "savings" ? "var(--accent2)" : "var(--foreground)",
                marginBottom: 4,
              }}
            >
              Desafio de Economia
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
              Quem economiza mais em 30, 60 ou 90 dias?
            </div>
          </button>

        </div>
      </div>

      {/* Seleção de dias (apenas modo savings) */}
      {mode === "savings" && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 10,
            }}
          >
            Duração
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {([30, 60, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  background: days === d
                    ? "linear-gradient(135deg, rgba(96,212,240,0.2), rgba(200,240,96,0.1))"
                    : "rgba(255,255,255,0.03)",
                  border: days === d
                    ? "2px solid var(--accent2)"
                    : "2px solid var(--border)",
                  borderRadius: 12,
                  padding: "14px 8px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontWeight: 900,
                    fontSize: 22,
                    color: days === d ? "var(--accent2)" : "var(--foreground)",
                  }}
                >
                  {d}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>dias</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumo */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          fontSize: 13,
          color: "var(--muted)",
          lineHeight: 1.5,
        }}
      >
        {mode === "hard"
          ? "🏁 Você e seu amigo vão competir para ver quem acumula R$100.000 primeiro. O vencedor é quem tiver mais guardado."
          : `📊 Vocês vão competir para ver quem economiza mais em ${days} dias. A poupança acumulada durante o período decide o vencedor.`}
      </div>

      {/* Erro */}
      {error && (
        <div
          style={{
            background: "rgba(240,96,96,0.1)",
            border: "1px solid rgba(240,96,96,0.3)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            color: "#f06060",
          }}
        >
          {error}
        </div>
      )}

      {/* Botão criar */}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        style={{
          background: isPending
            ? "rgba(200,240,96,0.2)"
            : "linear-gradient(135deg, var(--accent), var(--accent2))",
          border: "none",
          borderRadius: 14,
          padding: "16px",
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: isPending ? "var(--muted)" : "#0a0a0f",
          cursor: isPending ? "not-allowed" : "pointer",
          width: "100%",
          transition: "all 0.2s",
          letterSpacing: "-0.3px",
        }}
      >
        {isPending ? "Criando desafio..." : "⚔️ Criar Desafio"}
      </button>
    </div>
  );
}
