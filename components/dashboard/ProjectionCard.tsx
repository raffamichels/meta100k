import { fmt, MONTH_NAMES } from "@/lib/utils";
import type { Projection } from "@/lib/calculations";

interface ProjectionCardProps {
  projection: Projection;
  totalSaved: number;
}

export function ProjectionCard({ projection, totalSaved }: ProjectionCardProps) {
  let dateText = "— — —";
  let detailText = "Registre economia para ver a projeção";

  if (projection.done) {
    dateText = "🎉 Meta atingida!";
    detailText = `Você já acumulou ${fmt(totalSaved)}`;
  } else if (projection.months) {
    const d = projection.date;
    dateText = `${MONTH_NAMES[d.getMonth()]} / ${d.getFullYear()}`;
    detailText = `em ~${projection.months} meses · guardando ${fmt(projection.avg)}/mês`;
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(200,240,96,0.12), rgba(96,212,240,0.08))",
        border: "1px solid rgba(200,240,96,0.25)",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--muted)",
        }}
      >
        📅 Projeção para atingir R$ 100.000
      </div>
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-1px",
          color: "var(--accent)",
          margin: "8px 0 4px",
        }}
      >
        {dateText}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{detailText}</div>
    </div>
  );
}
