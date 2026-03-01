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

export function thisMonth(): string {
  return new Date().toISOString().slice(0, 7);
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

export const CAT_COLORS = [
  "#c8f060","#60d4f0","#f060a0","#f0c060","#60f0a0",
  "#f09060","#a060f0","#60a0f0","#f06060","#90f060",
];

/** Count consecutive months with savings > 0, going back from current month */
export function calcConsecutiveStreak(
  months: Array<{ key: string; savings: number }>
): number {
  const now = new Date();
  let streak = 0;
  let checkYear = now.getFullYear();
  let checkMonth = now.getMonth() + 1; // 1-indexed

  const monthMap = new Map(months.map((m) => [m.key, m.savings]));

  // Allow the current month to not have savings yet (start checking from previous)
  // Go back month by month until we find one without savings
  for (let i = 0; i < 24; i++) {
    const key = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
    const savings = monthMap.get(key) ?? 0;

    if (savings > 0) {
      streak++;
    } else if (i === 0) {
      // Current month with no savings — start from previous
    } else {
      break;
    }

    checkMonth--;
    if (checkMonth === 0) {
      checkMonth = 12;
      checkYear--;
    }
  }

  return streak;
}
