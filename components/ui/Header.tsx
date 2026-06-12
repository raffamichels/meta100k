import { calcDailyStreak } from "@/lib/utils";
import { LevelBadge } from "@/components/gamification/LevelBadge";

interface HeaderProps {
  savingEntries: Array<{ date: string; value: number }>;
  xp: number;
  userName?: string | null;
}

/** Saudação conforme o horário de Brasília */
function getGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(new Date())
  );
  if (hour >= 5 && hour < 12) return "Bom dia,";
  if (hour >= 12 && hour < 18) return "Boa tarde,";
  return "Boa noite,";
}

export function Header({ savingEntries, xp, userName }: HeaderProps) {
  const streak = calcDailyStreak(savingEntries);
  const firstName = userName?.trim().split(" ")[0] || "Investidor";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    // className="app-header" → no desktop adiciona padding-left para
    // alinhar o conteúdo com o main content (evita sobreposição com sidebar)
    <header
      className="app-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--accent)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        boxShadow: "0 2px 12px rgba(34,197,94,0.25)",
      }}
    >
      {/* Avatar + saudação */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            border: "2px solid rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {initial}
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
            {getGreeting()}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "#ffffff",
              letterSpacing: "-0.2px",
            }}
          >
            {firstName}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {/* Badge de nível */}
        <LevelBadge xp={xp} compact />

        {/* Streak badge: pill translúcido sobre o header verde */}
        <div
          style={{
            background: "rgba(255,255,255,0.22)",
            border: "1px solid rgba(255,255,255,0.35)",
            color: "#ffffff",
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
