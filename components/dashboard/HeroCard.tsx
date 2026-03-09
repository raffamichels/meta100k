"use client";

// HeroCard.tsx — Card principal do dashboard com barra de progresso clicável.
// A barra ganha um hint "🗺️ Ver jornada" que abre o MapaModal ao ser clicado.

import { useState } from "react";
import { fmt } from "@/lib/utils";
import { MapaModal } from "./MapaModal";

interface HeroCardProps {
  totalSaved: number;
  goal: number;
}

const MILESTONES = [
  { pct: 10, label: "Iniciado", icon: "🌱" },
  { pct: 25, label: "Um Quarto", icon: "🏅" },
  { pct: 50, label: "Metade", icon: "💰" },
  { pct: 75, label: "Sprint Final", icon: "🚀" },
  { pct: 90, label: "Quase Lá", icon: "⚡" },
  { pct: 100, label: "Meta!", icon: "👑" },
];

export function HeroCard({ totalSaved, goal }: HeroCardProps) {
  const pct = Math.min((totalSaved / goal) * 100, 100);
  const remaining = Math.max(goal - totalSaved, 0);

  // Estado para controlar o modal do Mapa do Tesouro
  const [modalAberto, setModalAberto] = useState(false);

  // Último marco atingido e próximo marco
  const lastReached = [...MILESTONES].reverse().find((m) => m.pct <= pct);
  const nextMilestone = MILESTONES.find((m) => m.pct > pct);

  return (
    <>
      {/* className="hero-card-wrapper" → no mobile: borda mais sutil */}
      <div
        className="hero-card-wrapper"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: 24,
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow decoration — className="hero-glow-decor" oculto no mobile */}
        <div
          className="hero-glow-decor"
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            background: "radial-gradient(circle, rgba(200,240,96,0.15), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* className="hero-progress-label" → no mobile remove uppercase robótico */}
        <div
          className="hero-progress-label"
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          Progresso da meta
        </div>

        {/* className="hero-value-amount" → no mobile: display size agressivo */}
        <div
          className="hero-value-amount"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          <span style={{ color: "var(--accent)" }}>{fmt(totalSaved)}</span>
          <small style={{ fontSize: 22, color: "var(--muted)" }}> / 100K</small>
        </div>

        {/* className="hero-remaining" → no mobile: texto menor e mais sutil */}
        <div className="hero-remaining" style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
          {remaining > 0
            ? `Faltam ${fmt(remaining)} para sua meta`
            : "🎉 Meta atingida! Parabéns!"}
        </div>

        {/* Progress bar clicável — abre o Mapa do Tesouro */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          {/* Área clicável da barra */}
          {/* className="hero-progress-track" → no mobile: barra fina estilo fintech */}
          <div
            onClick={() => setModalAberto(true)}
            className="hero-progress-track"
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 100,
              height: 12,
              position: "relative",
              cursor: "pointer",
            }}
          >
            {/* Preenchimento */}
            <div
              className="progress-fill"
              style={{
                height: "100%",
                borderRadius: 100,
                background: "linear-gradient(90deg, var(--accent), var(--accent2))",
                width: `${pct}%`,
                transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: "0 0 10px rgba(200,240,96,0.35)",
              }}
            />

            {/* Marcadores de marco */}
            {MILESTONES.map((m) => {
              const reached = pct >= m.pct;
              return (
                <div
                  key={m.pct}
                  title={`${m.icon} ${m.label} — ${m.pct}%`}
                  style={{
                    position: "absolute",
                    left: `${m.pct}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: reached ? 14 : 8,
                    height: reached ? 14 : 8,
                    borderRadius: "50%",
                    background: reached ? "var(--accent)" : "rgba(255,255,255,0.2)",
                    border: reached ? "2px solid rgba(10,10,15,0.8)" : "2px solid rgba(255,255,255,0.1)",
                    boxShadow: reached ? "0 0 8px rgba(200,240,96,0.7)" : "none",
                    transition: "all 0.4s ease",
                    zIndex: 2,
                    pointerEvents: "none", // clique passa para o wrapper
                  }}
                />
              );
            })}
          </div>

          {/* Labels dos marcos + hint do mapa — className="hero-milestone-labels" oculto no mobile */}
          <div className="hero-milestone-labels" style={{ position: "relative", height: 22, marginTop: 6 }}>
            {MILESTONES.map((m) => {
              const reached = pct >= m.pct;
              return (
                <div
                  key={m.pct}
                  style={{
                    position: "absolute",
                    left: `${m.pct}%`,
                    transform: "translateX(-50%)",
                    fontSize: 9,
                    fontWeight: 700,
                    color: reached ? "var(--accent)" : "rgba(255,255,255,0.2)",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    transition: "color 0.4s ease",
                  }}
                >
                  {m.pct}%
                </div>
              );
            })}
          </div>
        </div>

        {/* Linha de status + hint "Ver jornada" — className="hero-status-line" */}
        <div
          className="hero-status-line"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          <span>
            <strong style={{ color: "var(--accent)" }}>{pct.toFixed(1)}%</strong>{" "}
            concluído
            {lastReached && (
              <span style={{ marginLeft: 6, opacity: 0.65 }}>
                · {lastReached.icon} {lastReached.label}
              </span>
            )}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {nextMilestone && (
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                próximo: {nextMilestone.icon} {nextMilestone.pct}%
              </span>
            )}
            {/* Hint clicável para o Mapa do Tesouro */}
            <button
              onClick={() => setModalAberto(true)}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                color: "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,240,96,0.5)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
              }}
            >
              🗺️ Ver jornada
            </button>
          </div>
        </div>
      </div>

      {/* Modal do Mapa do Tesouro */}
      {modalAberto && (
        <MapaModal
          totalSaved={totalSaved}
          goal={goal}
          onClose={() => setModalAberto(false)}
        />
      )}
    </>
  );
}
