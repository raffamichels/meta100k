// Utilitários do Coach Preditivo — compartilhados entre servidor e cliente

export type TipoAnalise = "dia8" | "dia15" | "dia22" | "dia1";

/** Retorna o tipo de análise correspondente ao dia do mês, ou null se não for dia de análise */
export function getTipoAnalise(dia: number): TipoAnalise | null {
  if (dia === 1) return "dia1";
  if (dia === 8) return "dia8";
if (dia === 15) return "dia15";
  if (dia === 22) return "dia22";
  return null;
}

/** Retorna a chave do período atual (ex: "2026-03-15") ou null se hoje não for dia de análise */
export function getCoachPeriodKey(now: Date): string | null {
  const dia = now.getDate();
  if (!getTipoAnalise(dia)) return null;
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(dia).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Funções client-only (localStorage) ─────────────────────────────────────

const STORAGE_KEY = "coachNotification";

type CoachStorage = { period: string; read: boolean };

/** Verifica se o badge de coach deve aparecer (client-side only) */
export function shouldShowCoachBadge(): boolean {
  if (typeof window === "undefined") return false;
  const periodKey = getCoachPeriodKey(new Date());
  if (!periodKey) return false;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true; // Nunca viu antes

  try {
    const stored = JSON.parse(raw) as CoachStorage;
    // Novo período ou ainda não leu
    return stored.period !== periodKey || !stored.read;
  } catch {
    return true;
  }
}

/** Marca a análise do período atual como lida (client-side only) */
export function markCoachRead(): void {
  if (typeof window === "undefined") return;
  const periodKey = getCoachPeriodKey(new Date());
  if (!periodKey) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ period: periodKey, read: true }));
}
