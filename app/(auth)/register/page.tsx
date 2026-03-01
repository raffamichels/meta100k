"use client";

import { useActionState } from "react";
import { registerUser } from "@/lib/actions/auth";
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

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerUser, undefined);

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
        Criar conta
      </h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Comece sua jornada rumo a R$ 100.000
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
          <label style={labelStyle}>Nome (opcional)</label>
          <input
            type="text"
            name="name"
            placeholder="Seu nome"
            style={inputStyle}
          />
        </div>

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
          <label style={labelStyle}>Senha (mín. 6 caracteres)</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
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
          {pending ? "Criando conta..." : "Criar conta"}
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
        Já tem conta?{" "}
        <Link
          href="/login"
          style={{ color: "var(--accent)", fontWeight: 500 }}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
