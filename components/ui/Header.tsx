import { calcConsecutiveStreak } from "@/lib/utils";
import { signOut } from "@/lib/auth";

interface HeaderProps {
  months: Array<{ key: string; savings: number }>;
}

export function Header({ months }: HeaderProps) {
  const streak = calcConsecutiveStreak(months);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: "-0.5px",
        }}
      >
        meta<span style={{ color: "var(--accent)" }}>100K</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            background: "rgba(200,240,96,0.12)",
            border: "1px solid rgba(200,240,96,0.3)",
            color: "var(--accent)",
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 20,
          }}
        >
          {streak > 0
            ? `🔥 ${streak} ${streak === 1 ? "mês" : "meses"} consecutivos`
            : "🎯 Iniciando"}
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "4px 10px",
              color: "var(--muted)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
