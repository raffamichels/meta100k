import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { thisMonth, calcDailyStreak } from "@/lib/utils";
import {
  calcTotalSaved,
  calcProjection,
} from "@/lib/calculations";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { ProjectionCard } from "@/components/dashboard/ProjectionCard";
import { RecentEntries } from "@/components/dashboard/RecentEntries";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      months: {
        // Inclui savingEntries para o cálculo do streak diário no banner
        include: { expenses: true, extras: true, savingEntries: true },
      },
    },
  });

  if (!user) redirect("/login");

  const data = { goal: user.goal, baseAmount: user.baseAmount, months: user.months };
  const totalSaved = calcTotalSaved(data);
  const projection = calcProjection(data);

  // Current month stats
  const currentMonthKey = thisMonth();
  const currentMonth = user.months.find((m) => m.key === currentMonthKey);
  const monthSalary = currentMonth?.salary ?? 0;
  const monthSavings = currentMonth?.savings ?? 0;
  const monthExpenses = currentMonth?.expenses.reduce((a, e) => a + e.value, 0) ?? 0;
  const monthExtras = currentMonth?.extras.reduce((a, e) => a + e.value, 0) ?? 0;

  // Streak diário — achata todos os registros individuais de economia
  const allSavingEntries = user.months.flatMap((m) => m.savingEntries);
  const streak = calcDailyStreak(allSavingEntries);

  // Recent entries (last 5, expenses + extras combined, sorted by date desc)
  const allEntries: Array<{
    id: string;
    desc: string;
    value: number;
    date: string;
    type: "expense" | "extra";
    category?: string;
  }> = [];

  for (const mo of user.months) {
    for (const e of mo.expenses)
      allEntries.push({ ...e, type: "expense" });
    for (const e of mo.extras)
      allEntries.push({ id: e.id, desc: e.desc, value: e.value, date: e.date, type: "extra" });
  }

  allEntries.sort((a, b) => b.date.localeCompare(a.date));
  const recentEntries = allEntries.slice(0, 5);

  return (
    // .dashboard-grid → no desktop: grid 2 colunas (3fr / 2fr), alinhamento pelo topo
    // No mobile: div transparente, componentes empilhados normalmente
    <div className="dashboard-grid">

      {/* Coluna esquerda: progresso + stats — maior peso visual */}
      <div className="dashboard-left">

        {/* Banner de ofensiva diária — endomarketing para manter o usuário engajado */}
        <div
          style={{
            background: streak > 0
              ? "linear-gradient(135deg, rgba(240,140,40,0.13) 0%, rgba(200,240,96,0.08) 100%)"
              : "linear-gradient(135deg, rgba(96,212,240,0.07) 0%, rgba(200,240,96,0.07) 100%)",
            border: streak > 0
              ? "1px solid rgba(240,140,40,0.35)"
              : "1px solid rgba(96,212,240,0.25)",
            borderRadius: 20,
            padding: "18px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Ícone com glow quando há streak ativo */}
          <div
            style={{
              fontSize: 42,
              lineHeight: 1,
              flexShrink: 0,
              filter: streak > 0 ? "drop-shadow(0 0 14px rgba(240,140,40,0.55))" : "none",
            }}
          >
            {streak > 0 ? "🔥" : "🎯"}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: streak > 0 ? "#f08c28" : "var(--accent2)",
                marginBottom: 4,
              }}
            >
              {streak > 0
                ? `${streak} ${streak === 1 ? "dia consecutivo" : "dias consecutivos"}! Continue hoje.`
                : "Sua ofensiva começa hoje!"}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>
              {streak > 0
                ? `Você guardou dinheiro ${streak} ${streak === 1 ? "dia seguido" : "dias seguidos"}. Guarde qualquer valor hoje para não perder sua sequência!`
                : "Guarde R$ 1,00 ou mais hoje e comece a construir sua sequência diária. Cada dia conta na jornada rumo aos 100K!"}
            </div>
          </div>

          {/* Contador numérico em destaque — só exibe quando há streak ativo */}
          {streak > 0 && (
            <div
              style={{
                flexShrink: 0,
                textAlign: "center",
                background: "rgba(240,140,40,0.15)",
                border: "1px solid rgba(240,140,40,0.3)",
                borderRadius: 14,
                padding: "8px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: 900,
                  fontSize: 26,
                  color: "#f08c28",
                  lineHeight: 1,
                }}
              >
                {streak}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(240,140,40,0.7)",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginTop: 2,
                }}
              >
                {streak === 1 ? "dia" : "dias"}
              </div>
            </div>
          )}
        </div>

        <HeroCard totalSaved={totalSaved} goal={user.goal} />
        <StatsRow
          salary={monthSalary}
          expenses={monthExpenses}
          extras={monthExtras}
          savings={monthSavings}
        />
      </div>

      {/* Coluna direita: projeção + entradas recentes — informação complementar */}
      <div className="dashboard-right">
        <ProjectionCard projection={projection} totalSaved={totalSaved} />
        <RecentEntries entries={recentEntries} />
      </div>

    </div>
  );
}
