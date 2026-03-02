import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const months = await prisma.month.findMany({
    where: { userId },
    // Inclui savingEntries para calcular o streak diário no Header
    select: { key: true, savings: true, savingEntries: { select: { date: true, value: true } } },
  });

  // Achata todos os registros individuais de economia para o cálculo diário
  const allSavingEntries = months.flatMap((m) => m.savingEntries);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <Header savingEntries={allSavingEntries} />
      {/* className="main-content" → no desktop: margin-left para o sidebar + padding generoso */}
      <main style={{ padding: "20px 20px 100px" }} className="page-fade main-content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
