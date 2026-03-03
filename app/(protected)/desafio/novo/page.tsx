import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChallengeCreator } from "@/components/social/ChallengeCreator";
import Link from "next/link";

export default async function NovoDesafioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  // Busca desafios em andamento (pending ou active) do usuário
  const participations = await prisma.socialChallengeParticipant.findMany({
    where: {
      userId,
      challenge: { status: { in: ["pending", "active"] } },
    },
    include: {
      challenge: {
        include: {
          participants: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const challenges = participations.map((p) => p.challenge);

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-1px",
            marginBottom: 4,
          }}
        >
          ⚔️ Desafios
        </div>
        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          Desafie um amigo e cresçam juntos rumo aos R$100K
        </div>
      </div>

      {/* Lista de desafios em andamento */}
      {challenges.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {/* Label de seção */}
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "var(--muted)",
              marginBottom: 10,
            }}
          >
            Em andamento
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {challenges.map((c) => {
              const isHard = c.mode === "hard";
              const isPending = c.status === "pending";

              // Encontra o oponente (o outro participante que não é o usuário atual)
              const opponent = c.participants.find((p) => p.userId !== userId);
              const opponentName = opponent?.user.name ?? null;

              return (
                <Link
                  key={c.id}
                  href={`/desafio/${c.id}/arena`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: "var(--card)",
                    border: `1px solid ${
                      isPending
                        ? "var(--border)"
                        : isHard
                        ? "rgba(240,96,160,0.25)"
                        : "rgba(96,212,240,0.25)"
                    }`,
                    borderRadius: 16,
                    padding: "14px 16px",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Ícone do modo */}
                  <span style={{ fontSize: 26, flexShrink: 0 }}>
                    {isHard ? "🏁" : "📊"}
                  </span>

                  {/* Info do desafio */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-syne), sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--text)",
                        marginBottom: 2,
                      }}
                    >
                      {isHard ? "Corrida para R$100K" : `Desafio ${c.days} Dias`}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isPending
                        ? "⏳ Aguardando oponente"
                        : `vs ${opponentName ?? "Oponente"}`}
                    </div>
                  </div>

                  {/* Seta */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth={2}
                    width={16}
                    height={16}
                    style={{ flexShrink: 0 }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Label de seção do formulário */}
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "var(--muted)",
          marginBottom: 12,
        }}
      >
        Novo desafio
      </div>

      {/* Formulário de criação */}
      <ChallengeCreator />

    </div>
  );
}
