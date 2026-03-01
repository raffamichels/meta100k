import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { thisMonth } from "@/lib/utils";
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
        include: { expenses: true, extras: true },
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
    <>
      <HeroCard totalSaved={totalSaved} goal={user.goal} />
      <StatsRow
        salary={monthSalary}
        expenses={monthExpenses}
        extras={monthExtras}
        savings={monthSavings}
      />
      <ProjectionCard projection={projection} totalSaved={totalSaved} />
      <RecentEntries entries={recentEntries} />
    </>
  );
}
