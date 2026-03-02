import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, RARITY_COLORS, RARITY_LABELS } from "@/lib/achievements";
import { xpToNextLevel, calcLevel } from "@/lib/gamification";
import { calcDailyStreak, formatDate } from "@/lib/utils";
import { ActivityHeatmap } from "@/components/gamification/ActivityHeatmap";

export default async function ConquistasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: true,
      months: { include: { savingEntries: true } },
    },
    // Also get xp, level, maxStreak
  });

  if (!user) redirect("/login");

  const unlockedMap = new Map(user.achievements.map((a) => [a.key, a.unlockedAt]));
  const allSavingEntries = user.months.flatMap((m) => m.savingEntries);
  const streak = calcDailyStreak(allSavingEntries);
  const currentLevel = calcLevel(user.xp);
  const { next, progress } = xpToNextLevel(user.xp);

  const unlockedCount = user.achievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>

      {/* Header da página */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-1px",
            marginBottom: 4,
          }}
        >
          🏆 Conquistas
        </div>
        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          {unlockedCount} de {totalCount} desbloqueadas
        </div>
      </div>

      {/* Card de status do jogador */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(200,240,96,0.08), rgba(96,212,240,0.06))",
          border: "1px solid rgba(200,240,96,0.25)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 24,
          display: "flex",
          gap: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 40, marginBottom: 4, filter: "drop-shadow(0 0 12px rgba(200,240,96,0.5))" }}>
            {currentLevel.icon}
          </div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: "var(--accent)",
            }}
          >
            {currentLevel.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Nível {currentLevel.level}</div>
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>XP Total</span>
            <span style={{ fontWeight: 700, color: "var(--accent)" }}>
              {user.xp.toLocaleString("pt-BR")}
            </span>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 100,
              height: 8,
              overflow: "hidden",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 100,
                background: "linear-gradient(90deg, var(--accent), var(--accent2))",
                width: `${progress}%`,
                boxShadow: "0 0 8px rgba(200,240,96,0.4)",
              }}
            />
          </div>
          {next && (
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {(next.minXP - user.xp).toLocaleString("pt-BR")} XP para {next.icon} {next.name}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 900,
                fontSize: 22,
                color: "#f08c28",
              }}
            >
              {streak}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Streak atual
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 900,
                fontSize: 22,
                color: "var(--accent2)",
              }}
            >
              {user.maxStreak}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Recorde
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 900,
                fontSize: 22,
                color: "var(--accent)",
              }}
            >
              {unlockedCount}/{totalCount}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Conquistas
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap de atividade */}
      <ActivityHeatmap savingEntries={allSavingEntries} />

      {/* Grid de conquistas por raridade */}
      {(["legendary", "epic", "rare", "common"] as const).map((rarity) => {
        const group = ACHIEVEMENTS.filter((a) => a.rarity === rarity);
        const color = RARITY_COLORS[rarity];
        return (
          <div key={rarity} style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 8px ${color}88`,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color,
                }}
              >
                {RARITY_LABELS[rarity]}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                ({group.filter((a) => unlockedMap.has(a.key)).length}/{group.length})
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 10,
              }}
            >
              {group.map((ach) => {
                const unlockedAt = unlockedMap.get(ach.key);
                const isUnlocked = !!unlockedAt;

                return (
                  <div
                    key={ach.key}
                    style={{
                      background: isUnlocked ? "var(--card)" : "rgba(255,255,255,0.02)",
                      border: isUnlocked ? `1px solid ${color}44` : "1px solid rgba(255,255,255,0.06)",
                      borderLeft: isUnlocked ? `3px solid ${color}` : "3px solid rgba(255,255,255,0.06)",
                      borderRadius: 16,
                      padding: "14px 16px",
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      opacity: isUnlocked ? 1 : 0.45,
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 28,
                        flexShrink: 0,
                        filter: isUnlocked ? `drop-shadow(0 0 8px ${color}66)` : "grayscale(1)",
                      }}
                    >
                      {isUnlocked ? ach.icon : "🔒"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-syne), sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          marginBottom: 2,
                          color: isUnlocked ? "var(--text)" : "var(--muted)",
                        }}
                      >
                        {ach.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                        {ach.description}
                      </div>
                      {isUnlocked && unlockedAt && (
                        <div style={{ fontSize: 10, color: color, marginTop: 4, fontWeight: 600 }}>
                          Desbloqueada em {formatDate(unlockedAt.toISOString().split("T")[0])}
                        </div>
                      )}
                    </div>
                    {ach.xpReward > 0 && (
                      <div
                        style={{
                          flexShrink: 0,
                          fontSize: 11,
                          fontWeight: 700,
                          color: isUnlocked ? "var(--accent)" : "var(--muted)",
                          background: isUnlocked ? "rgba(200,240,96,0.1)" : "transparent",
                          border: isUnlocked ? "1px solid rgba(200,240,96,0.2)" : "none",
                          borderRadius: 8,
                          padding: "2px 8px",
                        }}
                      >
                        +{ach.xpReward} XP
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
