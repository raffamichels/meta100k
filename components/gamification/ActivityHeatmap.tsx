"use client";

import { useState } from "react";

interface ActivityHeatmapProps {
  savingEntries: Array<{ date: string; value: number }>;
}

function getIntensity(value: number): number {
  if (value === 0) return 0;
  if (value < 100) return 1;
  if (value < 500) return 2;
  if (value < 1000) return 3;
  return 4;
}

const INTENSITY_COLORS = [
  "rgba(255,255,255,0.05)",    // 0 — nenhum
  "rgba(200,240,96,0.25)",     // 1 — R$1–99
  "rgba(200,240,96,0.50)",     // 2 — R$100–499
  "rgba(200,240,96,0.75)",     // 3 — R$500–999
  "rgba(200,240,96,1.00)",     // 4 — R$1000+
];

const INTENSITY_LABELS = ["Nenhum", "R$1–99", "R$100–499", "R$500–999", "R$1.000+"];

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function ActivityHeatmap({ savingEntries }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; value: number; x: number; y: number } | null>(null);

  // Agrupa entradas por data
  const dayMap = new Map<string, number>();
  for (const s of savingEntries) {
    dayMap.set(s.date, (dayMap.get(s.date) ?? 0) + s.value);
  }

  // Gera as últimas 26 semanas (182 dias) — mobile friendly
  const today = new Date();
  const weeks: Array<Array<{ date: string; value: number; dayOfWeek: number }>> = [];

  // Começa no domingo da semana mais antiga
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 26 * 7 + 1);
  // Recua para o domingo anterior
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const current = new Date(startDate);
  let week: typeof weeks[0] = [];

  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0];
    const value = dayMap.get(dateStr) ?? 0;
    week.push({ date: dateStr, value, dayOfWeek: current.getDay() });

    if (current.getDay() === 6) {
      weeks.push(week);
      week = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (week.length > 0) weeks.push(week);

  // Meses para label do eixo X
  const monthLabels: Array<{ weekIndex: number; label: string }> = [];
  for (let wi = 0; wi < weeks.length; wi++) {
    const firstDay = weeks[wi][0];
    if (!firstDay) continue;
    const d = new Date(firstDay.date);
    if (d.getDate() <= 7) {
      const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      monthLabels.push({ weekIndex: wi, label: monthNames[d.getMonth()] });
    }
  }

  const cellSize = 12;
  const cellGap = 3;

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "18px 20px",
        marginBottom: 28,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        📅 Atividade de Economia
      </div>

      {/* Grid do heatmap */}
      <div style={{ position: "relative" }}>
        {/* Labels dos dias da semana */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: cellGap,
            position: "absolute",
            left: 0,
            top: 18,
          }}
        >
          {WEEK_LABELS.map((d, i) => (
            <div
              key={i}
              style={{
                height: cellSize,
                fontSize: 9,
                color: "var(--muted)",
                lineHeight: `${cellSize}px`,
                display: i % 2 === 0 ? "none" : "block",
                paddingRight: 4,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div style={{ paddingLeft: 28 }}>
          {/* Labels dos meses */}
          <div style={{ display: "flex", gap: cellGap, marginBottom: 4, height: 14 }}>
            {weeks.map((_, wi) => {
              const label = monthLabels.find((m) => m.weekIndex === wi);
              return (
                <div
                  key={wi}
                  style={{
                    width: cellSize,
                    fontSize: 9,
                    color: "var(--muted)",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label ? label.label : ""}
                </div>
              );
            })}
          </div>

          {/* Células do heatmap */}
          <div style={{ display: "flex", gap: cellGap }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: cellGap }}>
                {Array.from({ length: 7 }).map((_, dow) => {
                  const cell = week.find((c) => c.dayOfWeek === dow);
                  const value = cell?.value ?? 0;
                  const dateStr = cell?.date ?? "";
                  const intensity = getIntensity(value);
                  const isFuture = dateStr > today.toISOString().split("T")[0];

                  return (
                    <div
                      key={dow}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 3,
                        background: isFuture || !dateStr ? "transparent" : INTENSITY_COLORS[intensity],
                        border: isFuture || !dateStr ? "none" : `1px solid rgba(255,255,255,0.04)`,
                        cursor: value > 0 ? "pointer" : "default",
                        transition: "transform 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!dateStr || isFuture) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ date: dateStr, value, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 14,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 10, color: "var(--muted)" }}>Menos</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div
            key={i}
            title={INTENSITY_LABELS[i]}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 3,
              background: color,
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: "var(--muted)" }}>Mais</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 16,
            top: tooltip.y - 44,
            background: "rgba(10,10,15,0.95)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text)",
            zIndex: 9998,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <div>{formatDateBR(tooltip.date)}</div>
          <div style={{ color: "var(--accent)" }}>
            {tooltip.value > 0 ? `R$ ${tooltip.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}` : "Sem economia"}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateBR(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
