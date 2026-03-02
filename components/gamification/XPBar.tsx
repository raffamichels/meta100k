import { xpToNextLevel } from "@/lib/gamification";

interface XPBarProps {
  xp: number;
}

export function XPBar({ xp }: XPBarProps) {
  const { current, next, progress } = xpToNextLevel(xp);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "14px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      {/* Ícone do nível atual */}
      <div
        style={{
          fontSize: 28,
          lineHeight: 1,
          flexShrink: 0,
          filter: "drop-shadow(0 0 8px rgba(200,240,96,0.4))",
        }}
      >
        {current.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nome e nível */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <div>
            <span
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize: 14,
                color: "var(--accent)",
              }}
            >
              {current.name}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--muted)",
                marginLeft: 6,
                fontWeight: 500,
              }}
            >
              Nível {current.level}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
            {xp.toLocaleString("pt-BR")} XP
          </span>
        </div>

        {/* Barra de XP */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 100,
            height: 7,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 100,
              background: "linear-gradient(90deg, var(--accent), var(--accent2))",
              width: `${progress}%`,
              transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 0 8px rgba(200,240,96,0.4)",
            }}
          />
        </div>

        {/* Próximo nível */}
        {next && (
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
            {next.icon} {next.name} em{" "}
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              {(next.minXP - xp).toLocaleString("pt-BR")} XP
            </span>
          </div>
        )}
        {!next && (
          <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 4, fontWeight: 700 }}>
            Nível máximo atingido! 🏆
          </div>
        )}
      </div>
    </div>
  );
}
