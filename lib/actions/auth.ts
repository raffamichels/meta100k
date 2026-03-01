"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

type AuthState = { error: string } | undefined;

export async function registerUser(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha todos os campos obrigatórios" };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Este e-mail já está cadastrado" };
  }

  const hashedPassword = await hash(password, 12);
  await prisma.user.create({
    data: { email, name: name || null, password: hashedPassword },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: "Erro ao entrar automaticamente. Tente na página de login." };
  }
}

export async function loginUser(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha todos os campos" };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: "E-mail ou senha incorretos" };
  }
}
