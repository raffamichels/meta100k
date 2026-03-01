"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastContextValue {
  showToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 90,
          left: "50%",
          transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
          background: "var(--accent)",
          color: "#0a0a0f",
          padding: "10px 20px",
          borderRadius: 100,
          fontWeight: 600,
          fontSize: 14,
          opacity: visible ? 1 : 0,
          transition: "all 0.3s",
          zIndex: 999,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          fontFamily: "var(--font-dm-sans), sans-serif",
        }}
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
