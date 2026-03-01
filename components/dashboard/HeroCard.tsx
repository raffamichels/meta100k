import { fmt } from "@/lib/utils";

interface HeroCardProps {
  totalSaved: number;
  goal: number;
}

export function HeroCard({ totalSaved, goal }: HeroCardProps) {
  const pct = Math.min((totalSaved / goal) * 100, 100);
  const remaining = Math.max(goal - totalSaved, 0);

  return (
    <div
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
      {/* Glow decoration */}
      <div
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

      <div
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

      <div
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

      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
        {remaining > 0
          ? `Faltam ${fmt(remaining)} para sua meta`
          : "🎉 Meta atingida! Parabéns!"}
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: 100,
          height: 10,
          overflow: "hidden",
          marginBottom: 8,
          position: "relative",
        }}
      >
        <div
          className="progress-fill"
          style={{
            height: "100%",
            borderRadius: 100,
            background: "linear-gradient(90deg, var(--accent), var(--accent2))",
            width: `${pct}%`,
            position: "relative",
            transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--muted)",
        }}
      >
        <span>
          <strong style={{ color: "var(--accent)" }}>{pct.toFixed(1)}%</strong>{" "}
          concluído
        </span>
        <span>{(100 - pct).toFixed(1)}% restante</span>
      </div>
    </div>
  );
}
