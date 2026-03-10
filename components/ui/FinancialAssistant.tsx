"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Tipos espelhados dos definidos em route.ts
type ExpenseEntry    = { type: "expense";    desc: string; value: number; category: string; date: string };
type SalaryEntry     = { type: "salary";     value: number; month: string };
type SavingsEntry    = { type: "savings";    desc: string; value: number; date: string };
type ExtraEntry      = { type: "extra";      desc: string; value: number; date: string };
type TemptationEntry = { type: "temptation"; desc: string; value: number; category: string; place?: string; date: string };
type EntryData = ExpenseEntry | SalaryEntry | SavingsEntry | ExtraEntry | TemptationEntry;

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Olá! Sou o **Tony**, seu assistente financeiro do Meta100k 💰\n\nEstou aqui para ajudar com dúvidas sobre sua conta, hábitos de poupança, análise dos seus gastos e dicas financeiras personalizadas. O que posso fazer por você?",
};

// Renderiza markdown básico (negrito e quebras de linha)
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

export function FinancialAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  // Lançamento aguardando confirmação do usuário
  const [pendingEntry, setPendingEntry] = useState<EntryData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Para o pulso após 5s
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Foca input ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const closeChat = useCallback(() => {
    setOpen(false);
    setInput("");
    setMessages([WELCOME_MESSAGE]);
    setPendingEntry(null);
  }, []);

  // Aceita texto opcional para envio direto (ex.: sugestões rápidas)
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) throw new Error("Erro na API");

      const data = await res.json() as { content: string; pendingEntry?: EntryData };
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      // Se a IA identificou um lançamento, armazena para confirmação
      if (data.pendingEntry) setPendingEntry(data.pendingEntry);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, tive um problema para processar sua pergunta. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Confirma e salva o lançamento pendente via API unificada
  const confirmEntry = useCallback(async () => {
    if (!pendingEntry || loading) return;
    const entry = pendingEntry;
    setLoading(true);
    setPendingEntry(null);
    try {
      const res = await fetch("/api/chat/confirm-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error("Erro ao salvar");

      // Mensagem de sucesso adaptada ao tipo de lançamento
      const fmtVal = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      let successMsg = "✅ Lançamento registrado com sucesso!";
      if (entry.type === "expense")
        successMsg = `✅ Despesa de **R$ ${fmtVal(entry.value)}** (${entry.desc}) registrada! Já aparece no histórico.`;
      else if (entry.type === "salary")
        successMsg = `✅ Salário de **R$ ${fmtVal(entry.value)}** registrado para ${entry.month.split("-").reverse().join("/")}!`;
      else if (entry.type === "savings")
        successMsg = `🏦 Economia de **R$ ${fmtVal(entry.value)}** (${entry.desc}) registrada! Continue assim!`;
      else if (entry.type === "extra")
        successMsg = `⚡ Ganho de **R$ ${fmtVal(entry.value)}** (${entry.desc}) adicionado!`;
      else if (entry.type === "temptation")
        successMsg = `😈🔒 **R$ ${fmtVal(entry.value)}** salvos no Cofre do Diabo! Você resistiu a: ${entry.desc}. Parabéns!`;

      setMessages((prev) => [...prev, { role: "assistant", content: successMsg }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ops, não consegui registrar o lançamento. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [pendingEntry, loading]);

  // Cancela o lançamento pendente
  const cancelEntry = useCallback(() => {
    setPendingEntry(null);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Tudo bem! Lançamento cancelado. Posso ajudar com mais alguma coisa?" },
    ]);
  }, []);

  const SUGGESTIONS = [
    "Quanto guardei até agora?",
    "Qual minha taxa de poupança?",
    "Como está meu streak?",
    "Dicas para economizar mais",
  ];

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir Tony, assistente financeiro"
        style={{
          position: "fixed",
          bottom: "calc(64px + max(4px, env(safe-area-inset-bottom)) + 16px)",
          right: 20,
          zIndex: 150,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #c8f060, #60d4f0)",
          border: "none",
          cursor: "pointer",
          display: open ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: pulse
            ? "0 0 0 8px rgba(200,240,96,0.2), 0 4px 20px rgba(200,240,96,0.4)"
            : "0 4px 20px rgba(200,240,96,0.35)",
          transition: "box-shadow 0.3s, transform 0.2s",
          animation: pulse ? "assistantPulse 1.5s ease-in-out infinite" : "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Ícone de robô/assistente */}
        <svg viewBox="0 0 24 24" fill="none" width={26} height={26}>
          <rect x="5" y="8" width="14" height="10" rx="3" fill="#0a0a0f" />
          <rect x="8" y="11" width="2.5" height="2.5" rx="1" fill="#c8f060" />
          <rect x="13.5" y="11" width="2.5" height="2.5" rx="1" fill="#c8f060" />
          <path d="M9 16.5h6" stroke="#60d4f0" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 8V5" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="4" r="1.5" fill="#0a0a0f" />
          <path d="M5 13H3" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M21 13h-2" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={closeChat}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Chat modal */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 210,
          maxWidth: 480,
          margin: "0 auto",
          height: open ? "75vh" : 0,
          maxHeight: 600,
          borderRadius: open ? "24px 24px 0 0" : "0",
          background: "var(--surface)",
          borderTop: open ? "1px solid var(--border)" : "none",
          borderLeft: open ? "1px solid var(--border)" : "none",
          borderRight: open ? "1px solid var(--border)" : "none",
          borderBottom: "none",
          overflow: "hidden",
          transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8f060, #60d4f0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
              <rect x="5" y="8" width="14" height="10" rx="3" fill="#0a0a0f" />
              <rect x="8" y="11" width="2.5" height="2.5" rx="1" fill="#c8f060" />
              <rect x="13.5" y="11" width="2.5" height="2.5" rx="1" fill="#c8f060" />
              <path d="M9 16.5h6" stroke="#60d4f0" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 8V5" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="4" r="1.5" fill="#0a0a0f" />
              <path d="M5 13H3" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M21 13h-2" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "var(--text)",
              }}
            >
              Tony
            </div>
            <div style={{ fontSize: 11, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--success)",
                  display: "inline-block",
                }}
              />
              Online
            </div>
          </div>
          <button
            onClick={closeChat}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mensagens */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 16px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius:
                    msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, rgba(200,240,96,0.15), rgba(200,240,96,0.08))"
                      : "var(--card)",
                  border:
                    msg.role === "user"
                      ? "1px solid rgba(200,240,96,0.25)"
                      : "1px solid var(--border)",
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "var(--text)",
                }}
              >
                {renderMarkdown(msg.content)}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--muted)",
                      display: "inline-block",
                      animation: `dotBounce 1.2s ease-in-out ${dot * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Botões de confirmação de lançamento */}
          {pendingEntry && !loading && (
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={confirmEntry}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 14,
                  border: "none",
                  background: "rgba(200,240,96,0.15)",
                  color: "#c8f060",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  WebkitTapHighlightColor: "transparent",
                  transition: "background 0.2s",
                }}
              >
                ✅ Confirmar lançamento
              </button>
              <button
                onClick={cancelEntry}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 14,
                  border: "none",
                  background: "rgba(240,96,96,0.1)",
                  color: "rgba(240,96,96,0.85)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  WebkitTapHighlightColor: "transparent",
                  transition: "background 0.2s",
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          )}

          {/* Sugestões (apenas na primeira mensagem) */}
          {messages.length === 1 && !loading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  // Envia a sugestão diretamente, sem precisar clicar em Enviar
                  onClick={() => sendMessage(s)}
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "6px 12px",
                    fontSize: 12,
                    color: "var(--accent2)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexShrink: 0,
            paddingBottom: "calc(12px + max(0px, env(safe-area-inset-bottom)))",
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre suas finanças..."
            disabled={loading}
            style={{
              flex: 1,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: "10px 16px",
              fontSize: 14,
              color: "var(--text)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background:
                loading || !input.trim()
                  ? "rgba(200,240,96,0.2)"
                  : "linear-gradient(135deg, #c8f060, #60d4f0)",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
              <path
                d="M22 2L11 13"
                stroke={loading || !input.trim() ? "var(--muted)" : "#0a0a0f"}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke={loading || !input.trim() ? "var(--muted)" : "#0a0a0f"}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Animações */}
      <style>{`
        @keyframes assistantPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,240,96,0.4), 0 4px 20px rgba(200,240,96,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(200,240,96,0), 0 4px 20px rgba(200,240,96,0.5); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
