"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { ACHIEVEMENT_MAP } from "@/lib/achievements";
import type { GamificationResult } from "@/lib/actions/gamification";

interface Notification {
  id: number;
  type: "achievement" | "levelup" | "xp" | "challenge";
  achievementKey?: string;
  levelIcon?: string;
  levelName?: string;
  xpGained?: number;
}

interface GamificationContextValue {
  processResult: (result: GamificationResult | undefined) => void;
}

const GamificationContext = createContext<GamificationContextValue>({
  processResult: () => {},
});

export function useGamification() {
  return useContext(GamificationContext);
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counterRef = useRef(0);

  const addNotification = useCallback((n: Omit<Notification, "id">) => {
    const id = ++counterRef.current;
    setNotifications((prev) => [...prev, { ...n, id }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  const processResult = useCallback(
    (result: GamificationResult | undefined) => {
      if (!result) return;

      // XP gained (sempre)
      if (result.xpGained > 0) {
        addNotification({ type: "xp", xpGained: result.xpGained });
      }

      // Level up
      if (result.leveledUp) {
        addNotification({ type: "levelup", levelIcon: result.newLevelIcon, levelName: result.newLevelName });
      }

      // Novas conquistas
      for (const key of result.newAchievements) {
        addNotification({ type: "achievement", achievementKey: key });
      }
    },
    [addNotification]
  );

  return (
    <GamificationContext.Provider value={{ processResult }}>
      {children}
      <NotificationStack notifications={notifications} />
    </GamificationContext.Provider>
  );
}

function NotificationStack({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {notifications.map((n) => (
        <NotificationItem key={n.id} n={n} />
      ))}
    </div>
  );
}

function NotificationItem({ n }: { n: Notification }) {
  if (n.type === "xp") {
    return (
      <div
        style={{
          background: "rgba(200,240,96,0.15)",
          border: "1px solid rgba(200,240,96,0.4)",
          borderRadius: 14,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          backdropFilter: "blur(12px)",
          animation: "slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 4px 20px rgba(200,240,96,0.15)",
        }}
      >
        <span style={{ fontSize: 20 }}>⚡</span>
        <span
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--accent)",
          }}
        >
          +{n.xpGained} XP
        </span>
      </div>
    );
  }

  if (n.type === "levelup") {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, rgba(200,240,96,0.2), rgba(96,212,240,0.15))",
          border: "1px solid rgba(200,240,96,0.5)",
          borderRadius: 18,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          backdropFilter: "blur(12px)",
          animation: "slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 8px 32px rgba(200,240,96,0.25)",
          minWidth: 220,
        }}
      >
        <span style={{ fontSize: 32, filter: "drop-shadow(0 0 12px rgba(200,240,96,0.6))" }}>
          {n.levelIcon}
        </span>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: "var(--accent)",
              marginBottom: 2,
            }}
          >
            LEVEL UP!
          </div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: "var(--text)",
            }}
          >
            {n.levelName}
          </div>
        </div>
      </div>
    );
  }

  if (n.type === "achievement") {
    const def = n.achievementKey ? ACHIEVEMENT_MAP.get(n.achievementKey) : undefined;
    if (!def) return null;

    const rarityColor =
      def.rarity === "legendary" ? "#f0c060" :
      def.rarity === "epic"      ? "#a060f0" :
      def.rarity === "rare"      ? "#60a0f0" :
      "#90f060";

    return (
      <div
        style={{
          background: "rgba(19,19,26,0.97)",
          border: `1px solid ${rarityColor}55`,
          borderLeft: `3px solid ${rarityColor}`,
          borderRadius: 16,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          backdropFilter: "blur(16px)",
          animation: "slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: `0 8px 32px ${rarityColor}22`,
          minWidth: 240,
        }}
      >
        <span
          style={{
            fontSize: 30,
            filter: `drop-shadow(0 0 10px ${rarityColor}88)`,
            flexShrink: 0,
          }}
        >
          {def.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: rarityColor,
              marginBottom: 2,
            }}
          >
            Conquista Desbloqueada!
          </div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: "var(--text)",
              marginBottom: 1,
            }}
          >
            {def.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{def.description}</div>
        </div>
        {def.xpReward > 0 && (
          <div
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              background: "rgba(200,240,96,0.1)",
              border: "1px solid rgba(200,240,96,0.2)",
              borderRadius: 8,
              padding: "3px 8px",
            }}
          >
            +{def.xpReward} XP
          </div>
        )}
      </div>
    );
  }

  return null;
}
