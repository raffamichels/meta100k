import { calcLevel } from "@/lib/gamification";

interface LevelBadgeProps {
  xp: number;
  compact?: boolean;
}

export function LevelBadge({ xp, compact = false }: LevelBadgeProps) {
  const level = calcLevel(xp);

  if (compact) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(255,255,255,0.22)",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: 20,
          padding: "4px 10px",
          fontSize: 12,
          fontWeight: 700,
          color: "#ffffff",
          cursor: "default",
          userSelect: "none",
        }}
        title={`${level.name} — Nível ${level.level} — ${xp.toLocaleString("pt-BR")} XP`}
      >
        <span>{level.icon}</span>
        <span style={{ fontFamily: "var(--font-display), sans-serif" }}>Nv. {level.level}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "6px 14px",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <span style={{ fontSize: 20 }}>{level.icon}</span>
      <div>
        <div
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 800,
            fontSize: 13,
            color: "var(--accent-dark)",
            lineHeight: 1,
          }}
        >
          {level.name}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>
          Nível {level.level} • {xp.toLocaleString("pt-BR")} XP
        </div>
      </div>
    </div>
  );
}
