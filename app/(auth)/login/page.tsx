"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#f4f6f5",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: "12px 14px",
  color: "var(--text)",
  fontFamily: "var(--font-body), sans-serif",
  fontSize: 15,
  outline: "none",
  WebkitAppearance: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  marginBottom: 6,
  fontWeight: 500,
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Preencha todos os campos");
      setPending(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha incorretos");
    } else {
      router.push("/");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        padding: 28,
        boxShadow: "var(--card-shadow)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        Entrar
      </h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Bem-vindo de volta à sua jornada financeira
      </p>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "var(--danger)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>E-mail</label>
          <input
            type="email"
            name="email"
            placeholder="seu@email.com"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Senha</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            required
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 14,
            border: "none",
            background: "var(--accent)",
            color: "#ffffff",
            fontFamily: "var(--font-display), sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "all 0.2s",
            letterSpacing: "0.3px",
            boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
          }}
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        Não tem conta?{" "}
        <Link
          href="/register"
          style={{ color: "var(--accent-dark)", fontWeight: 500 }}
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
