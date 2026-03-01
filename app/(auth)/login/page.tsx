"use client";

import { useActionState } from "react";
import { loginUser } from "@/lib/actions/auth";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "12px 14px",
  color: "var(--text)",
  fontFamily: "var(--font-dm-sans), sans-serif",
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
  const [state, action, pending] = useActionState(loginUser, undefined);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        padding: 28,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
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

      {state?.error && (
        <div
          style={{
            background: "rgba(240,96,96,0.12)",
            border: "1px solid rgba(240,96,96,0.3)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "var(--danger)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {state.error}
        </div>
      )}

      <form action={action}>
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
            color: "#0a0a0f",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "all 0.2s",
            letterSpacing: "0.3px",
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
          style={{ color: "var(--accent)", fontWeight: 500 }}
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
