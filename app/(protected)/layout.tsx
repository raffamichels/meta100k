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
    select: { key: true, savings: true },
  });

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <Header months={months} />
      <main style={{ padding: "20px 20px 100px" }} className="page-fade">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
