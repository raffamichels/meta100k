"use client";

import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? "var(--accent)" : "rgba(200,240,96,0.12)",
        border: "1px solid rgba(200,240,96,0.3)",
        borderRadius: 8,
        padding: "6px 14px",
        color: copied ? "#0a0a0f" : "var(--accent)",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "✓ Copiado!" : "Copiar"}
    </button>
  );
}
