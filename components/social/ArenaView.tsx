"use client";

import { fmt } from "@/lib/utils";

export type ArenaParticipant = {
  id: string;
  name: string;
  levelIcon: string;
  levelName: string;
  totalSaved: number;
  challengeSavings: number;
  isCurrentUser: boolean;
};

export type ArenaChallenge = {
  id: string;
  mode: string;
  days: number | null;
  startDate: string;
  endDate: string | null;
  status: string;
};

type Props = {
  challenge: ArenaChallenge;
  participants: ArenaParticipant[];
};

export function ArenaView({ challenge, participants }: Props) {
  const isHard = challenge.mode === "hard";
  const GOAL = 100000;

  // Ordena para colocar o usuário atual primeiro se houver 2 participantes
  const [me, opponent] = participants.length >= 2
    ? participants[0].isCurrentUser
      ? [participants[0], participants[1]]
      : [participants[1], participants[0]]
    : [participants[0], null];

  const myValue = isHard ? me.totalSaved : me.challengeSavings;
  const opponentValue = opponent
    ? isHard ? opponent.totalSaved : opponent.challengeSavings
    : null;

  const myPct = isHard
    ? Math.min((myValue / GOAL) * 100, 100)
    : opponentValue != null
      ? opponentValue > 0 || myValue > 0
        ? Math.min((myValue / Math.max(myValue, opponentValue)) * 100, 100)
        : 0
      : 100;

  const opponentPct = opponentValue != null && (isHard
    ? Math.min((opponentValue / GOAL) * 100, 100)
    : myValue > 0 || opponentValue > 0
      ? Math.min((opponentValue / Math.max(myValue, opponentValue)) * 100, 100)
      : 0);

  const iAmWinning = opponentValue != null && myValue > opponentValue;
  const tied = opponentValue != null && myValue === opponentValue;

  // Dias restantes para modo savings
  let daysLeft: number | null = null;
  let totalDays: number | null = null;
  let periodPct = 0;
  if (!isHard && challenge.endDate) {
    const end = new Date(challenge.endDate);
    const now = new Date();
    const start = new Date(challenge.startDate);
    daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    totalDays = challenge.days ?? 30;
    const elapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    periodPct = Math.min((elapsed / totalDays) * 100, 100);
  }

  const hardModeFinished = isHard && (myValue >= GOAL || (opponentValue != null && opponentValue >= GOAL));
  const savingsModeFinished = !isHard && daysLeft === 0;
  const isFinished = challenge.status === "finished" || hardModeFinished || savingsModeFinished;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header da arena */}
      <div
        style={{
          background: isHard
            ? "linear-gradient(135deg, rgba(240,96,160,0.15), rgba(160,96,240,0.1))"
            : "linear-gradient(135deg, rgba(96,212,240,0.15), rgba(200,240,96,0.08))",
          border: isHard
            ? "1px solid rgba(240,96,160,0.4)"
            : "1px solid rgba(96,212,240,0.4)",
          borderRadius: 20,
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 6 }}>
          {isHard ? "🏁" : "📊"}
        </div>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: "-0.5px",
            marginBottom: 4,
            color: isHard ? "#f060a0" : "var(--accent2)",
          }}
        >
          {isHard ? "CORRIDA PARA R$100K" : `DESAFIO ${challenge.days} DIAS`}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {isHard
            ? "Quem chegar a R$100.000 primeiro vence"
            : `Quem economizar mais até ${challenge.endDate ? formatDateBR(challenge.endDate) : "—"}`}
        </div>

        {/* Barra de progresso do período (apenas modo savings) */}
        {!isHard && totalDays != null && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${periodPct}%`,
                  background: "linear-gradient(90deg, var(--accent2), var(--accent))",
                  borderRadius: 3,
                  transition: "width 0.8s ease",
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              {daysLeft === 0
                ? "Desafio encerrado"
                : `${daysLeft} ${daysLeft === 1 ? "dia restante" : "dias restantes"}`}
            </div>
          </div>
        )}
      </div>

      {/* Placar — só exibe se há oponente */}
      {opponent == null ? (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            Aguardando oponente...
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Compartilhe o link do desafio para que seu amigo possa aceitar.
          </div>
        </div>
      ) : (
        <>
          {/* Status — quem está ganhando */}
          <div
            style={{
              background: isFinished
                ? "rgba(200,240,96,0.08)"
                : tied
                  ? "rgba(255,255,255,0.05)"
                  : iAmWinning
                    ? "rgba(200,240,96,0.1)"
                    : "rgba(240,96,160,0.08)",
              border: isFinished
                ? "1px solid rgba(200,240,96,0.25)"
                : tied
                  ? "1px solid var(--border)"
                  : iAmWinning
                    ? "1px solid rgba(200,240,96,0.25)"
                    : "1px solid rgba(240,96,160,0.25)",
              borderRadius: 14,
              padding: "12px 16px",
              textAlign: "center",
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            {isFinished
              ? iAmWinning
                ? "🏆 Você venceu!"
                : opponentValue != null && opponentValue > myValue
                  ? `😤 ${opponent.name} venceu`
                  : "🤝 Empate!"
              : tied
                ? "🤝 Empate!"
                : iAmWinning
                  ? "👑 Você está liderando!"
                  : `😤 ${opponent.name} está na frente`}
          </div>

          {/* Cards dos jogadores */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <PlayerCard
              participant={me}
              value={myValue}
              pct={myPct}
              isHard={isHard}
              isWinning={!tied && iAmWinning}
              isMe
            />
            <PlayerCard
              participant={opponent}
              value={opponentValue ?? 0}
              pct={typeof opponentPct === "number" ? opponentPct : 0}
              isHard={isHard}
              isWinning={!tied && !iAmWinning}
              isMe={false}
            />
          </div>

          {/* VS divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "-8px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 900,
                fontSize: 13,
                color: "var(--muted)",
                letterSpacing: "1px",
              }}
            >
              VS
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Diferença */}
          <DifferenceCard
            myValue={myValue}
            opponentValue={opponentValue ?? 0}
            opponentName={opponent.name}
            isHard={isHard}
          />
        </>
      )}
    </div>
  );
}

// ─── PlayerCard ──────────────────────────────────────────────────────────────

function PlayerCard({
  participant,
  value,
  pct,
  isHard,
  isWinning,
  isMe,
}: {
  participant: ArenaParticipant;
  value: number;
  pct: number;
  isHard: boolean;
  isWinning: boolean;
  isMe: boolean;
}) {
  const accentColor = isWinning ? "#c8f060" : isMe ? "var(--accent2)" : "var(--muted)";

  return (
    <div
      style={{
        background: isWinning
          ? "linear-gradient(160deg, rgba(200,240,96,0.12), rgba(200,240,96,0.04))"
          : "rgba(255,255,255,0.03)",
        border: isWinning
          ? "1px solid rgba(200,240,96,0.35)"
          : "1px solid var(--border)",
        borderRadius: 18,
        padding: "18px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        position: "relative",
        transition: "all 0.3s",
      }}
    >
      {/* Coroa para quem está ganhando */}
      {isWinning && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 22,
            filter: "drop-shadow(0 0 8px rgba(200,240,96,0.8))",
          }}
        >
          👑
        </div>
      )}

      {/* Avatar com level */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${isWinning ? "rgba(200,240,96,0.25)" : "rgba(255,255,255,0.08)"}, rgba(255,255,255,0.04))`,
          border: `2px solid ${isWinning ? "rgba(200,240,96,0.5)" : "var(--border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          marginTop: isWinning ? 8 : 0,
        }}
      >
        {participant.levelIcon}
      </div>

      {/* Nome e nível */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: accentColor,
            marginBottom: 2,
            maxWidth: 110,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {isMe ? "Você" : participant.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>
          {participant.levelName}
        </div>
      </div>

      {/* Valor */}
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 900,
          fontSize: 16,
          color: isWinning ? "#c8f060" : "var(--foreground)",
          textAlign: "center",
          lineHeight: 1,
        }}
      >
        {fmt(value)}
      </div>

      {/* Barra de progresso */}
      <div style={{ width: "100%" }}>
        <div
          style={{
            height: 8,
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: isWinning
                ? "linear-gradient(90deg, #c8f060, #90f060)"
                : isMe
                  ? "linear-gradient(90deg, var(--accent2), var(--accent))"
                  : "rgba(255,255,255,0.2)",
              borderRadius: 4,
              transition: "width 1s ease",
              boxShadow: isWinning ? "0 0 8px rgba(200,240,96,0.5)" : "none",
            }}
          />
        </div>
        {isHard && (
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, textAlign: "center" }}>
            {pct.toFixed(1)}% da meta
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DifferenceCard ──────────────────────────────────────────────────────────

function DifferenceCard({
  myValue,
  opponentValue,
  opponentName,
  isHard,
}: {
  myValue: number;
  opponentValue: number;
  opponentName: string;
  isHard: boolean;
}) {
  const diff = Math.abs(myValue - opponentValue);
  const iAmAhead = myValue > opponentValue;
  const tied = myValue === opponentValue;

  if (tied) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          textAlign: "center",
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        🤝 Vocês estão empatados — cada centavo conta agora!
      </div>
    );
  }

  return (
    <div
      style={{
        background: iAmAhead
          ? "rgba(200,240,96,0.07)"
          : "rgba(240,96,160,0.07)",
        border: iAmAhead
          ? "1px solid rgba(200,240,96,0.2)"
          : "1px solid rgba(240,96,160,0.2)",
        borderRadius: 14,
        padding: "14px 16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: 15,
          color: iAmAhead ? "#c8f060" : "#f060a0",
          marginBottom: 4,
        }}
      >
        {iAmAhead ? `Você está ${fmt(diff)} na frente` : `${opponentName} está ${fmt(diff)} na frente`}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>
        {iAmAhead
          ? isHard
            ? "Continue poupando para ampliar sua vantagem!"
            : "Mantenha o ritmo para garantir a vitória!"
          : isHard
            ? "Poupe mais para virar o jogo!"
            : "Ainda dá tempo de virar — não desista!"}
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDateBR(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
