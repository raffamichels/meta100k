"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addXP } from "@/lib/gamification";

export async function createSocialChallenge(
  mode: "hard" | "savings",
  days?: number
): Promise<{ error?: string; id?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  if (mode === "savings" && (!days || ![30, 60, 90].includes(days))) {
    return { error: "Selecione o número de dias (30, 60 ou 90)" };
  }

  const today = new Date().toISOString().split("T")[0];
  let endDate: string | undefined;

  if (mode === "savings" && days) {
    const end = new Date();
    end.setDate(end.getDate() + days);
    endDate = end.toISOString().split("T")[0];
  }

  const challenge = await prisma.socialChallenge.create({
    data: {
      creatorId: session.user.id,
      mode,
      days: days ?? null,
      startDate: today,
      endDate: endDate ?? null,
      status: "pending",
      participants: {
        create: { userId: session.user.id },
      },
    },
  });

  // Conquista para o criador imediatamente
  const achievementKey = mode === "hard" ? "social_hard" : "social_savings";
  const xpReward = mode === "hard" ? 200 : 100;

  const alreadyHas = await prisma.userAchievement.findUnique({
    where: { userId_key: { userId: session.user.id, key: achievementKey } },
  });

  if (!alreadyHas) {
    await prisma.userAchievement.create({
      data: { userId: session.user.id, key: achievementKey },
    });
    await addXP(session.user.id, xpReward);
  }

  return { id: challenge.id };
}

export async function acceptSocialChallenge(
  challengeId: string
): Promise<{ error?: string; success?: boolean; alreadyJoined?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const challenge = await prisma.socialChallenge.findUnique({
    where: { id: challengeId },
    include: { participants: true },
  });

  if (!challenge) return { error: "Desafio não encontrado" };
  if (challenge.status === "finished") return { error: "Este desafio já terminou" };

  const alreadyIn = challenge.participants.some((p) => p.userId === session.user.id);
  if (alreadyIn) return { success: true, alreadyJoined: true };

  await prisma.socialChallengeParticipant.create({
    data: { challengeId, userId: session.user.id },
  });

  await prisma.socialChallenge.update({
    where: { id: challengeId },
    data: { status: "active" },
  });

  // Conquista para o aceitador
  const achievementKey = challenge.mode === "hard" ? "social_hard" : "social_savings";
  const xpReward = challenge.mode === "hard" ? 200 : 100;

  const alreadyHas = await prisma.userAchievement.findUnique({
    where: { userId_key: { userId: session.user.id, key: achievementKey } },
  });

  if (!alreadyHas) {
    await prisma.userAchievement.create({
      data: { userId: session.user.id, key: achievementKey },
    });
    await addXP(session.user.id, xpReward);
  }

  return { success: true };
}
