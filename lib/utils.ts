export function fmt(v: number): string {
  return (
    "R$ " +
    Number(v).toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

export function fmtFull(v: number): string {
  return (
    "R$ " +
    Number(v).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Retorna "hoje" no fuso GMT-3 (Brasil) como YYYY-MM-DD. */
function todayBR(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().split("T")[0];
}

export function thisMonth(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

export function formatDate(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export const MONTH_NAMES = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez",
];

export function formatMonth(s: string): string {
  const [y, m] = s.split("-");
  return MONTH_NAMES[parseInt(m) - 1] + " " + y;
}

export const EXPENSE_CATEGORIES = [
  "🏠 Moradia",
  "🍔 Alimentação",
  "🚗 Transporte",
  "💊 Saúde",
  "🎓 Educação",
  "🎉 Lazer",
  "👕 Vestuário",
  "📱 Assinaturas",
  "💡 Contas",
  "❓ Outros",
];

// Categorias de tentação — mais voltadas para impulsos de consumo
export const TEMPTATION_CATEGORIES = [
  "📱 Tecnologia",
  "👕 Vestuário",
  "🍔 Alimentação",
  "🎉 Lazer",
  "🏠 Casa & Decoração",
  "💄 Beleza",
  "🎮 Games",
  "✈️ Viagem",
  "💎 Luxo",
  "❓ Outros",
];

export const CAT_COLORS = [
  "#c8f060","#60d4f0","#f060a0","#f0c060","#60f0a0",
  "#f09060","#a060f0","#60a0f0","#f06060","#90f060",
];

/** Retorna true se já foi guardado pelo menos R$1,00 hoje (fuso GMT-3). */
export function hasSavedToday(savingEntries: Array<{ date: string; value: number }>): boolean {
  const today = todayBR();
  return savingEntries.some((s) => s.date === today && s.value >= 1);
}

/** Conta dias consecutivos onde pelo menos R$1,00 foi guardado.
 *  O dia de hoje sem registro não quebra a sequência (permite guardar ainda hoje).
 *  Usa fuso GMT-3 (Brasil) para determinar o dia atual.
 */
export function calcDailyStreak(
  savingEntries: Array<{ date: string; value: number }>
): number {
  // Agrupa por data somando os valores do dia
  const dayMap = new Map<string, number>();
  for (const s of savingEntries) {
    dayMap.set(s.date, (dayMap.get(s.date) ?? 0) + s.value);
  }

  let streak = 0;
  // Usa GMT-3 para que "hoje" corresponda ao dia local do usuário
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);

  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().split("T")[0];
    const total = dayMap.get(key) ?? 0;

    if (total >= 1) {
      streak++;
    } else if (i === 0) {
      // Hoje sem registro ainda — verifica ontem antes de desistir
    } else {
      break;
    }
  }

  return streak;
}
