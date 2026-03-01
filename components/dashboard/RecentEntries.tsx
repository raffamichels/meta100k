import { fmt, formatDate } from "@/lib/utils";

interface Entry {
  id: string;
  desc: string;
  value: number;
  date: string;
  type: "expense" | "extra";
  category?: string;
}

interface RecentEntriesProps {
  entries: Entry[];
}

export function RecentEntries({ entries }: RecentEntriesProps) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--muted)",
          marginBottom: 14,
          marginTop: 24,
        }}
      >
        Últimos registros
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          Nenhum registro ainda
        </div>
      ) : (
        entries.map((item) => (
          <div
            key={item.id}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background:
                  item.type === "expense"
                    ? "rgba(240,96,96,0.12)"
                    : "rgba(200,240,96,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {item.type === "expense"
                ? item.category?.split(" ")[0] || "💸"
                : "⚡"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.desc}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {item.type === "expense" ? item.category : "Ganho avulso"} ·{" "}
                {formatDate(item.date)}
              </div>
            </div>

            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 700,
                fontSize: 15,
                whiteSpace: "nowrap",
                color:
                  item.type === "expense" ? "var(--danger)" : "var(--accent)",
              }}
            >
              {item.type === "expense" ? "-" : "+"}
              {fmt(item.value)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
