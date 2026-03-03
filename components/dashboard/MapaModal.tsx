"use client";

// components/dashboard/MapaModal.tsx
// Modal do Mapa do Tesouro — exibe a trilha narrativa de fases da jornada.

import { useState } from "react";
import {
  FASES,
  getFaseAtual,
  getProgressoNaFase,
  getFasesConquistadas,
  getProximaFase,
  type Fase,
} from "@/lib/mapa";
import { fmt } from "@/lib/utils";

interface MapaModalProps {
  totalSaved: number;
  goal: number;
  onClose: () => void;
}

export function MapaModal({ totalSaved, goal, onClose }: MapaModalProps) {
  const pct = Math.min((totalSaved / goal) * 100, 100);
  const faseAtual = getFaseAtual(pct);
  const progressoNaFase = getProgressoNaFase(pct, faseAtual);
  const fasesConquistadas = getFasesConquistadas(pct);
  const conquistadasKeys = new Set(fasesConquistadas.map((f) => f.key));
  const proximaFase = getProximaFase(faseAtual);

  // Fase selecionada para exibir tooltip (null = nenhuma)
  const [faseSelecionada, setFaseSelecionada] = useState<Fase | null>(null);

  // Fecha modal ao clicar no fundo
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Valor necessário para chegar à próxima fase
  const valorParaProximaFase = proximaFase
    ? Math.max(0, (proximaFase.min / 100) * goal - totalSaved)
    : 0;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 16 }}>🗺️ Mapa da Jornada</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Banner da fase atual */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "20px 18px",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>{faseAtual.emoji}</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{faseAtual.nome}</div>
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
            {faseAtual.descricao}
          </div>
        </div>

        {/* Trilha de fases */}
        <div
          style={{
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              minWidth: "max-content",
              padding: "4px 0",
            }}
          >
            {FASES.map((fase, idx) => {
              const isConquistada = conquistadasKeys.has(fase.key);
              const isAtual = fase.key === faseAtual.key;
              const isFutura = !isConquistada && !isAtual;
              const isUltima = idx === FASES.length - 1;

              return (
                <div key={fase.key} style={{ display: "flex", alignItems: "center" }}>
                  {/* Ícone da fase */}
                  <button
                    onClick={() =>
                      setFaseSelecionada(faseSelecionada?.key === fase.key ? null : fase)
                    }
                    title={fase.nome}
                    style={{
                      background: isAtual
                        ? "var(--accent)"
                        : isConquistada
                        ? "rgba(200,240,96,0.2)"
                        : "rgba(255,255,255,0.06)",
                      border: isAtual
                        ? "2px solid var(--accent)"
                        : isConquistada
                        ? "2px solid rgba(200,240,96,0.5)"
                        : "2px solid rgba(255,255,255,0.1)",
                      borderRadius: "50%",
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      cursor: isFutura || isConquistada ? "pointer" : "default",
                      opacity: isFutura ? 0.45 : 1,
                      flexShrink: 0,
                      // Classe para animação de pulso na fase atual
                      ...(isAtual ? { animation: "mapPulse 2s ease-in-out infinite" } : {}),
                    }}
                    // desabilita clique na fase atual (já está no banner)
                    disabled={isAtual}
                  >
                    {fase.emoji}
                  </button>

                  {/* Conector entre fases */}
                  {!isUltima && (
                    <div
                      style={{
                        width: 20,
                        height: 2,
                        background:
                          isConquistada
                            ? "rgba(200,240,96,0.5)"
                            : "rgba(255,255,255,0.1)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tooltip da fase selecionada */}
        {faseSelecionada && faseSelecionada.key !== faseAtual.key && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {faseSelecionada.emoji} {faseSelecionada.nome}
            </div>
            <div style={{ color: "var(--muted)", marginBottom: 8, lineHeight: 1.4 }}>
              {faseSelecionada.descricao}
            </div>
            {conquistadasKeys.has(faseSelecionada.key) ? (
              // Fase conquistada
              <div style={{ color: "var(--accent)", fontSize: 12 }}>
                ✓ Fase conquistada · +{faseSelecionada.xp} XP ganhos
              </div>
            ) : (
              // Fase futura
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Faltam{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  {fmt(Math.max(0, (faseSelecionada.min / 100) * goal - totalSaved))}
                </strong>{" "}
                para chegar aqui · +{faseSelecionada.xp} XP ao entrar
              </div>
            )}
          </div>
        )}

        {/* Progresso na fase atual */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 6,
            }}
          >
            <span>Progresso na fase atual</span>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>
              {progressoNaFase.toFixed(0)}%
            </span>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 100,
              height: 8,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 100,
                background: "linear-gradient(90deg, var(--accent), var(--accent2))",
                width: `${progressoNaFase}%`,
                transition: "width 0.6s ease",
                boxShadow: "0 0 8px rgba(200,240,96,0.3)",
              }}
            />
          </div>
        </div>

        {/* Próxima fase ou mensagem de conclusão */}
        {proximaFase ? (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--muted)",
            }}
          >
            <div style={{ marginBottom: 2 }}>
              Próxima fase:{" "}
              <strong style={{ color: "var(--foreground)" }}>
                {proximaFase.emoji} {proximaFase.nome}
              </strong>
            </div>
            <div>
              Faltam{" "}
              <strong style={{ color: "var(--accent)" }}>{fmt(valorParaProximaFase)}</strong>
              {" · "}você está em{" "}
              <strong style={{ color: "var(--foreground)" }}>{fmt(totalSaved)}</strong>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "12px 16px",
              fontSize: 14,
              color: "var(--accent)",
              fontWeight: 700,
            }}
          >
            👑 Você conquistou o Grande Tesouro!
          </div>
        )}
      </div>
    </div>
  );
}
