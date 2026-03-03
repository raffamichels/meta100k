import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENTS,
  RARITY_COLORS,
  RARITY_LABELS,
  generateSeasonalAchievements,
  isDateInSeasonalWindow,
} from "@/lib/achievements";
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

  // ── Conquistas sazonais ──────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const currentYear  = Number(today.split("-")[0]);
  const currentMonth = Number(today.split("-")[1]);

  const allSeasonal = generateSeasonalAchievements(currentYear);

  // Revelação progressiva: só mostra sazonais cujo mês de início já chegou
  const visibleSeasonal = allSeasonal.filter(
    (ach) => ach.window.monthStart <= currentMonth
  );

  // Conquistas sazonais deste ano já desbloqueadas pelo usuário
  const unlockedSeasonalKeys = new Set(
    user.achievements
      .filter((a) => a.key.endsWith(`_${currentYear}`))
      .map((a) => a.key)
  );

  // Agrupamentos da seção sazonal
  const seasonalActiveNow = visibleSeasonal.filter(
    (ach) => isDateInSeasonalWindow(today, ach.window, currentYear) && !unlockedSeasonalKeys.has(ach.key)
  );
  const seasonalUnlocked = visibleSeasonal.filter((ach) => unlockedSeasonalKeys.has(ach.key));
  const seasonalMissed   = visibleSeasonal.filter(
    (ach) => !isDateInSeasonalWindow(today, ach.window, currentYear) && !unlockedSeasonalKeys.has(ach.key)
  );

  // Contador total atualizado: permanentes + sazonais visíveis
  const permanentUnlockedCount = user.achievements.filter((a) => !a.key.match(/_\d{4}$/)).length;
  const totalUnlocked = permanentUnlockedCount + unlockedSeasonalKeys.size;
  const totalCount    = ACHIEVEMENTS.length + visibleSeasonal.length;

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
          {totalUnlocked} de {totalCount} desbloqueadas
          <span style={{ fontSize: 11, marginLeft: 8, color: "var(--muted)", opacity: 0.6 }}>
            · Novas conquistas são reveladas todo mês
          </span>
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
              {totalUnlocked}/{totalCount}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Conquistas
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap de atividade */}
      <ActivityHeatmap savingEntries={allSavingEntries} />

      {/* ── Seção de Conquistas Sazonais ─────────────────────────────────────── */}
      {visibleSeasonal.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          {/* Header da seção sazonal */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.5px",
                marginBottom: 4,
              }}
            >
              🗓️ Conquistas Sazonais · {currentYear}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Edições únicas — aparecem mês a mês. Cada ano é uma nova chance.
            </div>
          </div>

          {/* Sub-seção 1: Disponíveis Agora */}
          {seasonalActiveNow.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13 }}>🔥</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#f0c060" }}>
                  Disponíveis Agora
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
                {seasonalActiveNow.map((ach) => {
                  const color = RARITY_COLORS[ach.rarity];
                  return (
                    <div
                      key={ach.key}
                      className="seasonal-available"
                      style={{
                        background: "var(--card)",
                        border: `2px solid ${color}88`,
                        borderLeft: `4px solid ${color}`,
                        borderRadius: 16,
                        padding: "14px 16px",
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                        position: "relative",
                      }}
                    >
                      <span style={{ fontSize: 28, flexShrink: 0, filter: `drop-shadow(0 0 8px ${color}66)` }}>
                        {ach.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                            {ach.title}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4, marginBottom: 6 }}>
                          {ach.description}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 7px" }}>
                            {RARITY_LABELS[ach.rarity]}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#f0c060", background: "rgba(240,192,96,0.12)", border: "1px solid rgba(240,192,96,0.3)", borderRadius: 6, padding: "2px 7px" }}>
                            🗓️ SAZONAL
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 7px" }}>
                            📅 {currentYear}
                          </span>
                        </div>
                      </div>
                      {ach.xpReward > 0 && (
                        <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "rgba(200,240,96,0.1)", border: "1px solid rgba(200,240,96,0.2)", borderRadius: 8, padding: "2px 8px" }}>
                          +{ach.xpReward} XP
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-seção 2: Conquistadas este ano */}
          {seasonalUnlocked.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13 }}>✅</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#90f060" }}>
                  Conquistadas este ano
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
                {seasonalUnlocked.map((ach) => {
                  const color = RARITY_COLORS[ach.rarity];
                  const unlockedAt = unlockedMap.get(ach.key);
                  return (
                    <div
                      key={ach.key}
                      style={{
                        background: "var(--card)",
                        border: `1px solid ${color}44`,
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 16,
                        padding: "14px 16px",
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ fontSize: 28, flexShrink: 0, filter: `drop-shadow(0 0 8px ${color}66)` }}>
                        {ach.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 2, color: "var(--text)" }}>
                          {ach.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4, marginBottom: 4 }}>
                          {ach.description}
                        </div>
                        {unlockedAt && (
                          <div style={{ fontSize: 10, color, fontWeight: 600 }}>
                            Desbloqueada em {formatDate(unlockedAt.toISOString().split("T")[0])}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 7px" }}>
                            {RARITY_LABELS[ach.rarity]}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#f0c060", background: "rgba(240,192,96,0.12)", border: "1px solid rgba(240,192,96,0.3)", borderRadius: 6, padding: "2px 7px" }}>
                            🗓️ SAZONAL
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 7px" }}>
                            📅 {currentYear}
                          </span>
                        </div>
                      </div>
                      {ach.xpReward > 0 && (
                        <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "rgba(200,240,96,0.1)", border: "1px solid rgba(200,240,96,0.2)", borderRadius: 8, padding: "2px 8px" }}>
                          +{ach.xpReward} XP
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-seção 3: Janelas encerradas (perdidas) */}
          {seasonalMissed.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13 }}>⌛</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--muted)" }}>
                  Meses anteriores — janela encerrada
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
                {seasonalMissed.map((ach) => {
                  const color = RARITY_COLORS[ach.rarity];
                  return (
                    <div
                      key={ach.key}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderLeft: "3px solid rgba(255,255,255,0.06)",
                        borderRadius: 16,
                        padding: "14px 16px",
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                        opacity: 0.35,
                      }}
                    >
                      <span style={{ fontSize: 28, flexShrink: 0, filter: "grayscale(1)" }}>🔒</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 2, color: "var(--muted)" }}>
                          {ach.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4, marginBottom: 4 }}>
                          {ach.description}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic" }}>
                          Não obtida este ano · volta em {currentYear + 1}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 7px" }}>
                            {RARITY_LABELS[ach.rarity]}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#f0c060", background: "rgba(240,192,96,0.12)", border: "1px solid rgba(240,192,96,0.3)", borderRadius: 6, padding: "2px 7px" }}>
                            🗓️ SAZONAL
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 7px" }}>
                            📅 {currentYear}
                          </span>
                        </div>
                      </div>
                      {ach.xpReward > 0 && (
                        <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "var(--muted)", borderRadius: 8, padding: "2px 8px" }}>
                          +{ach.xpReward} XP
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divisor entre sazonais e permanentes */}
      {visibleSeasonal.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: 28 }}>
          <div style={{ textAlign: "center", marginTop: 12, marginBottom: 20, fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>
            🏆 Conquistas Permanentes
          </div>
        </div>
      )}

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
