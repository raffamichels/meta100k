import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBudgets } from "@/lib/actions/budget";
import { thisMonth } from "@/lib/utils";
import { BudgetManager } from "@/components/orcamento/BudgetManager";

export default async function OrcamentoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const monthKey = thisMonth();

  // Dias restantes no mês (para exibir no card de progresso)
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const today = new Date();
  const daysLeft = Math.max(0, lastDay - today.getDate());

  const { activeBudgets, managedBudgets } = await getBudgets(monthKey);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <BudgetManager
        activeBudgets={activeBudgets}
        managedBudgets={managedBudgets}
        currentMonthKey={monthKey}
        daysLeft={daysLeft}
      />
    </div>
  );
}
