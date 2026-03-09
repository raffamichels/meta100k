import type { Challenge } from "@prisma/client";
import { CHALLENGE_TEMPLATES } from "@/lib/gamification";
import { fmt } from "@/lib/utils";

interface ChallengeCardProps {
  challenges: Challenge[];
}

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate + "T23:59:59");
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function getChallengeLabel(key: string, target: number): { title: string; description: string } {
  const template = CHALLENGE_TEMPLATES.find((t) => t.key === key);
  if (template) return { title: template.title(target), description: template.description(target) };
  return { title: key, description: "" };
}

export function ChallengeCard({ challenges }: ChallengeCardProps) {
  const active = challenges.filter((c) => !c.completed);
  const recentDone = challenges.filter((c) => c.completed).slice(-2);

  if (active.length === 0 && recentDone.length === 0) return null;

  return (
    // className="challenge-card-section" → no mobile: borda verde, fundo surface
    <div
      className="challenge-card-section"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(96,212,240,0.2)",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {/* className="challenge-card-title" → no mobile: compacto */}
      <div
        className="challenge-card-title"
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        🎯 Desafios
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {active.map((ch) => {
          const { title } = getChallengeLabel(ch.key, ch.target);
          const pct = Math.min((ch.current / ch.target) * 100, 100);
          const daysLeft = getDaysLeft(ch.endDate);
          const typeColor = ch.type === "weekly" ? "var(--accent2)" : "var(--accent)";

          return (
            // className="challenge-item" → no mobile: flat, fundo mais escuro
            <div
              key={ch.id}
              className="challenge-item"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  {/* className="challenge-type-badge" → no mobile: sempre verde */}
                  <div
                    className="challenge-type-badge"
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: typeColor,
                      marginBottom: 3,
                    }}
                  >
                    {ch.type === "weekly" ? "Desafio Semanal" : "Desafio Mensal"}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--text)",
                    }}
                  >
                    {title}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                    +{ch.xpReward} XP
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>
                    {daysLeft} {daysLeft === 1 ? "dia" : "dias"} restante{daysLeft !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Barra de progresso do desafio */}
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 100,
                  height: 6,
                  overflow: "hidden",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 100,
                    background: `linear-gradient(90deg, ${typeColor}, var(--accent))`,
                    width: `${pct}%`,
                    transition: "width 0.8s ease",
                    boxShadow: `0 0 6px ${typeColor}55`,
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
                <span>
                  {ch.key === "daily_streak"
                    ? `${Math.round(ch.current)}/${Math.round(ch.target)} dias`
                    : `${fmt(ch.current)} / ${fmt(ch.target)}`}
                </span>
                <span style={{ color: pct >= 100 ? "var(--accent)" : "var(--muted)" }}>
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}

        {/* Concluídos recentes */}
        {recentDone.map((ch) => {
          const { title } = getChallengeLabel(ch.key, ch.target);
          return (
            <div
              key={ch.id}
              style={{
                background: "rgba(200,240,96,0.04)",
                border: "1px solid rgba(200,240,96,0.15)",
                borderRadius: 14,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: 0.8,
              }}
            >
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Concluído</div>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{title}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                +{ch.xpReward} XP
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
