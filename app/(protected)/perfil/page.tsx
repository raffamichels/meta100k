import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { calcLevel, xpToNextLevel } from "@/lib/gamification";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { calcDailyStreak } from "@/lib/utils";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      xp: true,
      goal: true,
      baseAmount: true,
      maxStreak: true,
      achievements: { select: { key: true } },
      months: {
        select: {
          savings: true,
          savingEntries: { select: { date: true, value: true } },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const totalSaved = (user.baseAmount || 0) + user.months.reduce((a, m) => a + m.savings, 0);
  const goalPct = Math.min((totalSaved / user.goal) * 100, 100);

  const allSavingEntries = user.months.flatMap((m) => m.savingEntries);
  const streak = calcDailyStreak(allSavingEntries);

  const currentLevel = calcLevel(user.xp);
  const { next, progress: xpProgress } = xpToNextLevel(user.xp);

  const unlockedCount = user.achievements.length;
  const totalAchievements = ACHIEVEMENTS.length;

  const displayName = user.name || user.email;

  const navLinks = [
    {
      href: "/meta",
      icon: "🎯",
      label: "Meta",
      desc: `${goalPct.toFixed(1)}% concluído`,
    },
    {
      href: "/conquistas",
      icon: "🏆",
      label: "Troféus",
      desc: `${unlockedCount} de ${totalAchievements} desbloqueados`,
    },
    {
      href: "/historico",
      icon: "📊",
      label: "Histórico",
      desc: "Ver todos os lançamentos",
    },
    // Desafios movido para cá (saiu da barra de navegação inferior)
    {
      href: "/desafio/novo",
      icon: "⚔️",
      label: "Desafios",
      desc: "Desafios e rankings",
    },
    {
      href: "/cofre",
      icon: "😈",
      label: "Cofre do Diabo",
      desc: "Tentações resistidas e valor protegido",
    },
    // Orçamento: acesso exclusivo pelo Perfil (não aparece na BottomNav)
    {
      href: "/orcamento",
      icon: "📊",
      label: "Orçamento Mensal",
      desc: "Defina limites de gasto por categoria",
    },
  ];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Saudação */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: "-0.5px",
            marginBottom: 2,
          }}
        >
          Meu Perfil
        </div>
        <div style={{ color: "var(--muted)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </div>
      </div>

      {/* Card de progresso da meta */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(96,212,240,0.1), rgba(200,240,96,0.07))",
          border: "1px solid rgba(96,212,240,0.25)",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--muted)", marginBottom: 4 }}>
              Total guardado
            </div>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: "var(--accent2)",
                letterSpacing: "-1px",
              }}
            >
              {`R$ ${totalSaved.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 900,
                fontSize: 22,
                color: "var(--accent)",
              }}
            >
              {goalPct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              de R$ {user.goal.toLocaleString("pt-BR")}
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 100,
            height: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 100,
              background: "linear-gradient(90deg, var(--accent2), var(--accent))",
              width: `${goalPct}%`,
              boxShadow: "0 0 8px rgba(96,212,240,0.4)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Stats compactos: nível, streak, conquistas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {/* Nível */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid rgba(200,240,96,0.2)",
            borderRadius: 16,
            padding: "14px 10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 4, filter: "drop-shadow(0 0 8px rgba(200,240,96,0.4))" }}>
            {currentLevel.icon}
          </div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 12,
              fontWeight: 800,
              color: "var(--accent)",
              marginBottom: 1,
            }}
          >
            {currentLevel.name}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>Nível {currentLevel.level}</div>

          {/* Mini barra de XP */}
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 100,
              height: 3,
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 100,
                background: "var(--accent)",
                width: `${xpProgress}%`,
              }}
            />
          </div>
          {next && (
            <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 3 }}>
              {(next.minXP - user.xp).toLocaleString("pt-BR")} XP
            </div>
          )}
        </div>

        {/* Streak */}
        <div
          style={{
            background: "var(--card)",
            border: streak > 0 ? "1px solid rgba(240,140,40,0.3)" : "1px solid var(--border)",
            borderRadius: 16,
            padding: "14px 10px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 26,
              marginBottom: 4,
              filter: streak > 0 ? "drop-shadow(0 0 8px rgba(240,140,40,0.5))" : "none",
            }}
          >
            🔥
          </div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 18,
              fontWeight: 900,
              color: streak > 0 ? "#f08c28" : "var(--muted)",
              marginBottom: 1,
            }}
          >
            {streak}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>
            {streak === 1 ? "dia seguido" : "dias seguidos"}
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>
            Recorde: {user.maxStreak}
          </div>
        </div>

        {/* Conquistas */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid rgba(96,212,240,0.2)",
            borderRadius: 16,
            padding: "14px 10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 4 }}>🏅</div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 18,
              fontWeight: 900,
              color: "var(--accent2)",
              marginBottom: 1,
            }}
          >
            {unlockedCount}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>
            de {totalAchievements} badges
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 100,
              height: 3,
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 100,
                background: "var(--accent2)",
                width: `${(unlockedCount / totalAchievements) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {navLinks.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 18px",
              textDecoration: "none",
              borderBottom: i < navLinks.length - 1 ? "1px solid var(--border)" : "none",
              transition: "background 0.15s",
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--text)",
                  marginBottom: 2,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.desc}</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} width={16} height={16} style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Sair */}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 16,
            border: "1px solid rgba(240,96,96,0.25)",
            background: "rgba(240,96,96,0.06)",
            color: "var(--danger)",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}
        >
          Sair da conta
        </button>
      </form>

    </div>
  );
}
