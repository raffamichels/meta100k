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
          background: "rgba(200,240,96,0.1)",
          border: "1px solid rgba(200,240,96,0.25)",
          borderRadius: 20,
          padding: "4px 10px",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--accent)",
          cursor: "default",
          userSelect: "none",
        }}
        title={`${level.name} — Nível ${level.level} — ${xp.toLocaleString("pt-BR")} XP`}
      >
        <span>{level.icon}</span>
        <span style={{ fontFamily: "var(--font-syne), sans-serif" }}>Nv. {level.level}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(200,240,96,0.1)",
        border: "1px solid rgba(200,240,96,0.25)",
        borderRadius: 20,
        padding: "6px 14px",
      }}
    >
      <span style={{ fontSize: 20 }}>{level.icon}</span>
      <div>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: 13,
            color: "var(--accent)",
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
