"use client";

import type { WeeklyReportStats } from "./WeeklyReport";

interface WeeklyReportCardProps extends WeeklyReportStats {
  content: string;
}

function formatDateBR(d: string): string {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export function WeeklyReportCard({
  content,
  weekStart,
  weekEnd,
}: WeeklyReportCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(96,160,240,0.08) 0%, rgba(160,96,240,0.06) 100%)",
        border: "1px solid rgba(96,160,240,0.28)",
        borderRadius: 20,
        padding: "20px 22px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 26, filter: "drop-shadow(0 0 8px rgba(96,160,240,0.6))" }}>
          ✨
        </span>
        <div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: "#60a0f0",
              lineHeight: 1.2,
            }}
          >
            Resumo da semana
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
            {formatDateBR(weekStart)} – {formatDateBR(weekEnd)} · gerado por IA
          </div>
        </div>
      </div>

      <p style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.65, margin: 0, opacity: 0.9 }}>
        {content}
      </p>
    </div>
  );
}

export function WeeklyReportSkeleton() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(96,160,240,0.06) 0%, rgba(160,96,240,0.04) 100%)",
        border: "1px solid rgba(96,160,240,0.18)",
        borderRadius: 20,
        padding: "20px 22px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(96,160,240,0.15)" }} />
        <div>
          <div style={{ width: 130, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.07)", marginBottom: 5 }} />
          <div style={{ width: 180, height: 9, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
      {[100, 90, 85, 70, 95, 60].map((w, i) => (
        <div
          key={i}
          style={{
            width: `${w}%`,
            height: 10,
            borderRadius: 6,
            background: "rgba(255,255,255,0.05)",
            marginBottom: 8,
          }}
        />
      ))}
    </div>
  );
}
