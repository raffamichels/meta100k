import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calcLevel } from "@/lib/gamification";
import { ArenaView } from "@/components/social/ArenaView";
import type { ArenaParticipant, ArenaChallenge } from "@/components/social/ArenaView";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function ArenaPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const challenge = await prisma.socialChallenge.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              xp: true,
              goal: true,
              baseAmount: true,
              months: {
                select: {
                  savings: true,
                  savingEntries: { select: { date: true, value: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!challenge) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", paddingTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: 22,
          }}
        >
          Desafio não encontrado
        </div>
        <Link href="/" style={{ color: "var(--accent)", textDecoration: "none", marginTop: 16, display: "block" }}>
          ← Voltar
        </Link>
      </div>
    );
  }

  // Verifica se o usuário é participante
  const isParticipant = challenge.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    redirect(`/desafio/${id}`);
  }

  const today = new Date().toISOString().split("T")[0];

  // Monta dados dos participantes para o ArenaView
  const participants: ArenaParticipant[] = challenge.participants.map((p) => {
    const user = p.user;
    const levelDef = calcLevel(user.xp);

    // Total poupado para hard mode
    const totalSaved =
      (user.baseAmount ?? 0) +
      user.months.reduce((acc, m) => acc + (m.savings ?? 0), 0);

    // Poupança acumulada durante o período do desafio (savings mode)
    const startDate = challenge.startDate;
    const endDate = challenge.endDate ?? today;
    const challengeSavings = user.months
      .flatMap((m) => m.savingEntries)
      .filter((s) => s.date >= startDate && s.date <= endDate)
      .reduce((acc, s) => acc + s.value, 0);

    return {
      id: user.id,
      name: user.name ?? "Usuário",
      levelIcon: levelDef.icon,
      levelName: levelDef.name,
      totalSaved,
      challengeSavings,
      isCurrentUser: user.id === userId,
    };
  });

  const arenaChallenge: ArenaChallenge = {
    id: challenge.id,
    mode: challenge.mode,
    days: challenge.days,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    status: challenge.status,
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      {/* Header + back */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href={`/desafio/${id}`}
          style={{
            color: "var(--muted)",
            textDecoration: "none",
            fontSize: 22,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ←
        </Link>
        <div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: "-0.8px",
            }}
          >
            Arena
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            {challenge.mode === "hard" ? "Corrida para R$100K" : `Desafio ${challenge.days} dias`}
          </div>
        </div>
      </div>

      <ArenaView
        challenge={arenaChallenge}
        participants={participants}
      />
    </div>
  );
}
