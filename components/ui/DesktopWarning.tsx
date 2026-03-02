export function DesktopWarning() {
  return (
    <div className="desktop-warning">
      {/* Scanlines decorativas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,240,96,0.015) 2px, rgba(200,240,96,0.015) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Card central */}
      <div
        style={{
          position: "relative",
          maxWidth: 420,
          width: "90%",
          background: "var(--card)",
          border: "1px solid rgba(200,240,96,0.25)",
          borderRadius: 28,
          padding: "32px 36px",
          textAlign: "center",
          boxShadow: "0 0 80px rgba(200,240,96,0.08), 0 0 0 1px rgba(200,240,96,0.08)",
        }}
      >
        {/* Chips decorativos de XP no topo */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          {["🌱 Nível 1", "🔥 Streak", "🏆 Conquistas"].map((chip) => (
            <div
              key={chip}
              style={{
                background: "rgba(200,240,96,0.08)",
                border: "1px solid rgba(200,240,96,0.2)",
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--accent)",
                opacity: 0.7,
              }}
            >
              {chip}
            </div>
          ))}
        </div>

        {/* Ícone flutuante */}
        <div
          style={{
            fontSize: 60,
            marginBottom: 16,
            display: "block",
            animation: "floatPhone 3s ease-in-out infinite",
            filter: "drop-shadow(0 0 24px rgba(96,212,240,0.5))",
          }}
        >
          📱
        </div>

        {/* Badge de status */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(240,96,96,0.12)",
            border: "1px solid rgba(240,96,96,0.3)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--danger)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--danger)",
              display: "inline-block",
            }}
          />
          Dispositivo incompatível
        </div>

        {/* Título */}
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-1px",
            marginBottom: 10,
            lineHeight: 1.1,
          }}
        >
          Zona{" "}
          <span style={{ color: "var(--accent)" }}>Mobile</span>
        </div>

        {/* Descrição */}
        <div
          style={{
            color: "var(--muted)",
            fontSize: 15,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Este app foi forjado para guerreiros mobile.
          <br />
          Abra no seu celular para acessar seu
          <br />
          painel, ofensivas e conquistas.
        </div>

        {/* Barra de progresso decorativa */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 100,
            height: 6,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 100,
              width: "68%",
              background: "linear-gradient(90deg, var(--accent2), var(--accent))",
              boxShadow: "0 0 10px rgba(96,212,240,0.4)",
            }}
          />
        </div>

        {/* Stat chips inferiores */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          {[
            { icon: "💰", label: "Meta 100K" },
            { icon: "📊", label: "Finanças" },
            { icon: "🎯", label: "Streak diário" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "8px 12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div
        style={{
          marginTop: 20,
          fontSize: 12,
          color: "var(--muted)",
          opacity: 0.6,
        }}
      >
        meta<span style={{ color: "var(--accent)" }}>100K</span> · acesso exclusivo mobile
      </div>
    </div>
  );
}
