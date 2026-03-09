import { fmt } from "@/lib/utils";

interface StatsRowProps {
  salary: number;
  expenses: number;
  extras: number;
  savings: number;
}

interface StatCardProps {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
}

function StatCard({ icon, iconBg, label, value }: StatCardProps) {
  return (
    // className="stat-card" → no mobile: sem borda visível, fundo elevado sutil
    <div
      className="stat-card"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 16,
      }}
    >
      {/* className="stat-icon-box" → no mobile remove o fundo colorido */}
      <div
        className="stat-icon-box"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          marginBottom: 10,
        }}
      >
        {icon}
      </div>
      {/* className="stat-label" → no mobile remove uppercase e letter-spacing */}
      <div
        className="stat-label"
        style={{
          fontSize: 11,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function StatsRow({ salary, expenses, extras, savings }: StatsRowProps) {
  return (
    // className="stats-grid" → no desktop: 4 colunas em linha única (1x4)
    // No mobile: mantém o grid 2x2 definido no inline style
    <div
      className="stats-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <StatCard
        icon="💰"
        iconBg="rgba(200,240,96,0.12)"
        label="Renda Mensal"
        value={fmt(salary)}
      />
      <StatCard
        icon="💸"
        iconBg="rgba(240,96,96,0.12)"
        label="Gastos/Mês"
        value={fmt(expenses)}
      />
      <StatCard
        icon="📈"
        iconBg="rgba(96,212,240,0.12)"
        label="Extras/Mês"
        value={fmt(extras)}
      />
      <StatCard
        icon="🏦"
        iconBg="rgba(96,240,160,0.12)"
        label="Guardado/Mês"
        value={fmt(savings)}
      />
    </div>
  );
}
