export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: 32,
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.5px",
          }}
        >
          meta<span style={{ color: "var(--accent)" }}>100K</span>
        </div>
        {children}
      </div>
    </div>
  );
}
