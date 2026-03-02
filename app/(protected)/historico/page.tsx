import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { thisMonth } from "@/lib/utils";
import { HistoricoClient } from "@/components/historico/HistoricoClient";

export default async function HistoricoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const months = await prisma.month.findMany({
    where: { userId },
    include: { expenses: true, extras: true, savingEntries: true },
    orderBy: { key: "desc" },
  });

  const currentMonth = thisMonth();
  const allKeys = months.map((m) => m.key);

  if (!allKeys.includes(currentMonth)) {
    allKeys.unshift(currentMonth);
  }

  const monthsWithCurrent = months.find((m) => m.key === currentMonth)
    ? months
    : [
        {
          id: "placeholder",
          key: currentMonth,
          salary: 0,
          savings: 0,
          userId,
          expenses: [],
          extras: [],
          savingEntries: [],
        },
        ...months,
      ];

  const initialMonth = allKeys[0];

  return (
    <HistoricoClient months={monthsWithCurrent} initialMonth={initialMonth} />
  );
}
