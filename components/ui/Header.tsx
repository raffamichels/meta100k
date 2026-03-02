import { calcDailyStreak } from "@/lib/utils";
import { LevelBadge } from "@/components/gamification/LevelBadge";

interface HeaderProps {
  savingEntries: Array<{ date: string; value: number }>;
  xp: number;
}

export function Header({ savingEntries, xp }: HeaderProps) {
  const streak = calcDailyStreak(savingEntries);

  return (
    // className="app-header" → no desktop adiciona padding-left para
    // alinhar o conteúdo com o main content (evita sobreposição com sidebar)
    <header
      className="app-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: "-0.5px",
          flexShrink: 0,
        }}
      >
        meta<span style={{ color: "var(--accent)" }}>100K</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {/* Badge de nível */}
        <LevelBadge xp={xp} compact />

        {/* Streak badge */}
        <div
          style={{
            background: streak > 0 ? "rgba(240,140,40,0.15)" : "rgba(200,240,96,0.12)",
            border: streak > 0 ? "1px solid rgba(240,140,40,0.4)" : "1px solid rgba(200,240,96,0.3)",
            color: streak > 0 ? "#f08c28" : "var(--accent)",
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 20,
          }}
        >
          {streak > 0
            ? `🔥 ${streak} ${streak === 1 ? "dia" : "dias"}`
            : "🎯 Iniciando"}
        </div>

      </div>
    </header>
  );
}
