import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { acceptSocialChallenge } from "@/lib/actions/social";
import { CopyLinkButton } from "@/components/social/CopyLinkButton";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

function fmtDate(s: string): string {
  const [, m, d] = s.split("-");
  return `${d}/${m}`;
}

export default async function DesafioInvitePage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const challenge = await prisma.socialChallenge.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      participants: { select: { userId: true } },
    },
  });

  if (!challenge) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", paddingTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 800,
            fontSize: 22,
          }}
        >
          Desafio não encontrado
        </div>
        <div style={{ color: "var(--muted)", marginTop: 8, marginBottom: 24 }}>
          Este link pode ter expirado ou sido removido.
        </div>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "var(--accent)",
            color: "#ffffff",
            fontWeight: 800,
            borderRadius: 12,
            padding: "12px 24px",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
          }}
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  const isParticipant = challenge.participants.some((p) => p.userId === userId);
  const isCreator = challenge.creatorId === userId;
  const isHard = challenge.mode === "hard";
  const isFinished = challenge.status === "finished";
  const isPending = challenge.status === "pending";
  const creatorName = challenge.creator.name ?? "Seu amigo";

  // ─── Já é participante ───────────────────────────────────────────────────
  if (isParticipant) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: "-1px",
              marginBottom: 4,
            }}
          >
            {isHard ? "🏁 Corrida para R$100K" : `📊 Desafio ${challenge.days} Dias`}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            {isHard
              ? "Quem chegar a R$100.000 primeiro vence"
              : `Até ${challenge.endDate ? fmtDate(challenge.endDate) : "—"} — quem economizar mais`}
          </div>
        </div>

        {isCreator && isPending ? (
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "20px",
              marginBottom: 16,
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              ⏳ Aguardando seu amigo aceitar
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
              Compartilhe o link abaixo:
            </div>
            <div
              style={{
                background: "#f4f6f5",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: "var(--muted)",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                /desafio/{id}
              </span>
              <CopyLinkButton path={`/desafio/${id}`} />
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--accent-dark)",
                marginBottom: 4,
              }}
            >
              ✅ Você está neste desafio!
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Acesse a arena para ver o placar em tempo real.
            </div>
          </div>
        )}

        <Link
          href={`/desafio/${id}/arena`}
          style={{
            display: "block",
            background: "var(--accent)",
            color: "#ffffff",
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 800,
            fontSize: 16,
            borderRadius: 14,
            padding: "16px",
            textDecoration: "none",
            textAlign: "center",
            letterSpacing: "-0.3px",
            boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
          }}
        >
          {isFinished ? "Ver Resultado Final 🏆" : "Entrar na Arena ⚔️"}
        </Link>
      </div>
    );
  }

  // ─── Convite para aceitar ─────────────────────────────────────────────────

  async function acceptAction() {
    "use server";
    await acceptSocialChallenge(id);
    redirect(`/desafio/${id}/arena`);
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-1px",
            marginBottom: 4,
          }}
        >
          {isHard ? "🏁 Desafio Hard" : `📊 Desafio ${challenge.days} Dias`}
        </div>
        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          {creatorName} te enviou um desafio!
        </div>
      </div>

      <div
        style={{
          background: isHard
            ? "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(124,58,237,0.05))"
            : "linear-gradient(135deg, rgba(66,99,235,0.10), rgba(34,197,94,0.06))",
          border: isHard
            ? "1px solid rgba(124,58,237,0.3)"
            : "1px solid rgba(66,99,235,0.3)",
          borderRadius: 20,
          padding: "28px 24px",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>{isHard ? "🏁" : "📊"}</div>
        <div
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 900,
            fontSize: 22,
            marginBottom: 8,
            letterSpacing: "-0.5px",
            color: isHard ? "var(--accent3)" : "var(--accent2)",
          }}
        >
          {isHard ? "Corrida para R$100K" : `Desafio de ${challenge.days} Dias`}
        </div>
        <div
          style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}
        >
          {isHard
            ? `${creatorName} te desafia a ver quem chega primeiro aos R$100.000. Você está pronto?`
            : `${creatorName} te desafia a economizar mais em ${challenge.days} dias — até ${challenge.endDate ? fmtDate(challenge.endDate) : "—"}.`}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 12,
          }}
        >
          <span>{isHard ? "🏁" : "📊"}</span>
          <span
            style={{ color: isHard ? "var(--accent3)" : "var(--accent2)", fontWeight: 600 }}
          >
            Conquista: {isHard ? "Desafiante Hard (épico)" : "Poupador Social (raro)"}
          </span>
        </div>
      </div>

      {!isFinished ? (
        <form action={acceptAction}>
          <button
            type="submit"
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 14,
              padding: "16px",
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: "#ffffff",
              cursor: "pointer",
              width: "100%",
              letterSpacing: "-0.3px",
              boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
            }}
          >
            ⚔️ Aceitar Desafio
          </button>
        </form>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "14px 16px",
            textAlign: "center",
            fontSize: 14,
            color: "var(--muted)",
          }}
        >
          Este desafio já foi encerrado.
        </div>
      )}
    </div>
  );
}
