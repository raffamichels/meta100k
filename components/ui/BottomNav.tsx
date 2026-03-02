"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PROFILE_PATHS = ["/perfil", "/conquistas", "/meta", "/historico"];

export function BottomNav() {
  const pathname = usePathname();

  const homeActive = pathname === "/";
  const launchActive = pathname === "/lancamentos";
  const profileActive = PROFILE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <nav
      className="bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(19,19,26,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        height: "calc(64px + max(4px, env(safe-area-inset-bottom)))",
        paddingBottom: "max(4px, env(safe-area-inset-bottom))",
      }}
    >
      {/* Início */}
      <Link
        href="/"
        className="bottom-nav-link"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          textDecoration: "none",
          color: homeActive ? "var(--accent)" : "var(--muted)",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          transition: "color 0.2s",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
          <path d="M3 12L12 3l9 9" />
          <path d="M9 21V12h6v9" />
          <path d="M3 12v9h5v-9" />
          <path d="M16 21v-9h5V12" />
        </svg>
        Início
      </Link>

      {/* Lançar — botão central em destaque */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Link
          href="/lancamentos"
          className="bottom-nav-link"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            textDecoration: "none",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: launchActive
                ? "var(--accent2)"
                : "linear-gradient(135deg, var(--accent), var(--accent2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: launchActive
                ? "0 0 20px rgba(200,240,96,0.5)"
                : "0 4px 16px rgba(96,212,240,0.3)",
              transition: "all 0.2s",
              marginTop: -10,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth={2.5} width={24} height={24}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              color: launchActive ? "var(--accent2)" : "var(--muted)",
              marginTop: 4,
              transition: "color 0.2s",
            }}
          >
            Lançar
          </span>
        </Link>
      </div>

      {/* Perfil */}
      <Link
        href="/perfil"
        className="bottom-nav-link"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          textDecoration: "none",
          color: profileActive ? "var(--accent)" : "var(--muted)",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          transition: "color 0.2s",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        Perfil
      </Link>
    </nav>
  );
}
