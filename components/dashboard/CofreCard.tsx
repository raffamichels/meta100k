import Link from "next/link";

interface CofreCardProps {
  totalResistido: number;
  count: number;
  lastDesc: string | null;
  lastValue: number | null;
  topCategoryName: string | null;
  topCategoryTotal: number | null;
}

/** Card do Cofre do Diabo exibido no dashboard principal. */
export function CofreCard({
  totalResistido,
  count,
  lastDesc,
  lastValue,
  topCategoryName,
  topCategoryTotal,
}: CofreCardProps) {
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <Link
      href="/cofre"
      style={{
        display: "block",
        textDecoration: "none",
        background: "linear-gradient(135deg, rgba(180,60,240,0.08) 0%, rgba(120,40,200,0.05) 100%)",
        border: "1px solid rgba(180,60,240,0.3)",
        borderRadius: 20,
        padding: "18px 20px",
        marginBottom: 16,
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: 15,
            color: "#c060f0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ filter: "drop-shadow(0 0 6px rgba(180,60,240,0.6))", fontSize: 18 }}>
            😈
          </span>
          Cofre do Diabo
        </div>
        {/* Seta indicando que é clicável */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(180,60,240,0.5)"
          strokeWidth={2}
          width={14}
          height={14}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      {count === 0 ? (
        // Estado vazio — convida o usuário a começar
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>
            Ainda não há tentações registradas.
            <br />
            Resista ao próximo impulso e guarde aqui!
          </div>
        </div>
      ) : (
        <>
          {/* Valor total protegido */}
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 900,
              fontSize: 28,
              color: "#c060f0",
              lineHeight: 1,
              marginBottom: 2,
            }}
          >
            R$ {fmt(totalResistido)}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 10,
              letterSpacing: "0.3px",
            }}
          >
            protegidos de você mesmo
          </div>

          {/* Contagem */}
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
            <span style={{ color: "#c060f0", fontWeight: 700 }}>{count}</span>{" "}
            {count === 1 ? "tentação resistida" : "tentações resistidas"}
          </div>

          {/* Última tentação */}
          {lastDesc && lastValue !== null && (
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                marginBottom: 6,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Última:{" "}
              <span style={{ color: "var(--text)" }}>&ldquo;{lastDesc}&rdquo;</span>
              {" · "}
              <span style={{ color: "#c060f0" }}>R$ {fmt(lastValue)}</span>
            </div>
          )}

          {/* Top categoria */}
          {topCategoryName && topCategoryTotal !== null && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Top categoria:{" "}
              <span style={{ color: "var(--text)" }}>{topCategoryName.replace(/^\S+\s/, "")}</span>
              {" (R$ "}
              <span style={{ color: "#c060f0" }}>{fmt(topCategoryTotal)}</span>
              {")"}
            </div>
          )}
        </>
      )}
    </Link>
  );
}
