import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Preserva o singleton em todos os ambientes (inclusive produção/serverless).
// Sem isso, cada invocação no Vercel cria um PrismaClient novo,
// esgotando o pool de conexões do Supabase.
globalForPrisma.prisma = prisma;
