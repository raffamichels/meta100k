import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteTemptation } from "@/lib/actions/temptations";

export default async function CofrePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;

  const temptations = await prisma.temptation.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  const totalResistido = temptations.reduce((s, t) => s + t.value, 0);
  const count = temptations.length;

  // Série atual (tentações nos últimos 7 dias)
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const recentCount = temptations.filter(
    (t) => t.date >= sevenDaysAgoStr && t.date <= today
  ).length;

  // Ranking por categoria
  const catMap = new Map<string, { count: number; total: number }>();
  for (const t of temptations) {
    const cur = catMap.get(t.category) ?? { count: 0, total: 0 };
    catMap.set(t.category, { count: cur.count + 1, total: cur.total + t.value });
  }
  const catRanking = [...catMap.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 0 32px" }}>
      {/* Cabeçalho — className="cofre-header": mobile sem gradiente roxo */}
      <div
        className="cofre-header"
        style={{
          background: "linear-gradient(135deg, rgba(180,60,240,0.12), rgba(120,40,200,0.07))",
          border: "1px solid rgba(180,60,240,0.35)",
          borderRadius: 20,
          padding: "24px 22px",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 8, filter: "drop-shadow(0 0 16px rgba(180,60,240,0.5))" }}>
          😈
        </div>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 900,
            fontSize: 24,
            color: "#c060f0",
            marginBottom: 4,
          }}
        >
          Cofre do Diabo
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          O que você não gastou — por força de vontade.
        </div>
      </div>

      {/* Stats de topo — className="cofre-stats-grid" */}
      <div
        className="cofre-stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Total resistido */}
        <div
          className="cofre-stat-card"
          style={{
            background: "var(--card)",
            border: "1px solid rgba(180,60,240,0.25)",
            borderRadius: 16,
            padding: "14px 12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 900,
              fontSize: 20,
              color: "#c060f0",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            R$ {fmt(totalResistido)}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            total protegido
          </div>
        </div>

        {/* Quantidade */}
        <div
          className="cofre-stat-card"
          style={{
            background: "var(--card)",
            border: "1px solid rgba(180,60,240,0.25)",
            borderRadius: 16,
            padding: "14px 12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 900,
              fontSize: 20,
              color: "#c060f0",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {count}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            {count === 1 ? "tentação" : "tentações"}
          </div>
        </div>

        {/* Série dos últimos 7 dias */}
        <div
          className="cofre-stat-card"
          style={{
            background: "var(--card)",
            border: "1px solid rgba(180,60,240,0.25)",
            borderRadius: 16,
            padding: "14px 12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 900,
              fontSize: 20,
              color: "#c060f0",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {recentCount}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            nos últ. 7 dias
          </div>
        </div>
      </div>

      {/* Ranking por categoria */}
      {catRanking.length > 0 && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: "#c060f0",
              marginBottom: 12,
            }}
          >
            🏆 Ranking por Categoria
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Categoria", "Qtd", "Total resistido"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: 10,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      paddingBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catRanking.map((cat) => (
                <tr key={cat.name} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 0", fontSize: 13, color: "var(--text)" }}>
                    {cat.name}
                  </td>
                  <td style={{ padding: "8px 0", fontSize: 13, color: "var(--muted)" }}>
                    {cat.count}
                  </td>
                  <td
                    style={{
                      padding: "8px 0",
                      fontSize: 13,
                      color: "#c060f0",
                      fontWeight: 700,
                    }}
                  >
                    R$ {fmt(cat.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista cronológica — className="cofre-section-title" */}
      <div
        className="cofre-section-title"
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: 14,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          marginBottom: 10,
        }}
      >
        Histórico
      </div>

      {temptations.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "32px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
          <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
            Nenhuma tentação registrada ainda.
            <br />
            Vá em <strong style={{ color: "var(--text)" }}>Lançamentos</strong> e registre
            sua próxima resistência!
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {temptations.map((t) => (
            <div
              key={t.id}
              className="cofre-list-item"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(180,60,240,0.2)",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Ícone */}
              <div style={{ fontSize: 22, flexShrink: 0 }}>😈</div>

              {/* Dados */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.desc}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {t.category.replace(/^\S+\s/, "")}
                  {t.place ? ` · ${t.place}` : ""}
                  {" · "}
                  {t.date}
                </div>
              </div>

              {/* Valor */}
              <div
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "#c060f0",
                  flexShrink: 0,
                }}
              >
                R$ {fmt(t.value)}
              </div>

              {/* Botão deletar */}
              <form
                action={async () => {
                  "use server";
                  await deleteTemptation(t.id);
                }}
              >
                <button
                  type="submit"
                  title="Remover tentação"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: 16,
                    padding: "4px",
                    flexShrink: 0,
                    lineHeight: 1,
                    transition: "color 0.2s",
                  }}
                >
                  ✕
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
