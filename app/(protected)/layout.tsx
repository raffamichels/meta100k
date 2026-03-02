import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { GamificationProvider } from "@/components/gamification/GamificationContext";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const [months, user] = await Promise.all([
    prisma.month.findMany({
      where: { userId },
      select: { key: true, savings: true, savingEntries: { select: { date: true, value: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { xp: true } }),
  ]);

  const allSavingEntries = months.flatMap((m) => m.savingEntries);

  return (
    <GamificationProvider>
      <div style={{ position: "relative", zIndex: 1 }}>
        <Header savingEntries={allSavingEntries} xp={user?.xp ?? 0} />
        {/* className="main-content" → no desktop: margin-left para o sidebar + padding generoso */}
        <main style={{ padding: "20px 20px 100px" }} className="page-fade main-content">
          {children}
        </main>
        <BottomNav />
      </div>
    </GamificationProvider>
  );
}
