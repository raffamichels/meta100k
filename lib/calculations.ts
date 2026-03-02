import type { Month, Expense, Extra } from "@/generated/prisma";

type MonthWithRelations = Month & {
  expenses: Expense[];
  extras: Extra[];
};

type UserGoalData = {
  goal: number;
  baseAmount: number;
  months: MonthWithRelations[];
};

export function calcTotalSaved(data: UserGoalData): number {
  const fromMonths = data.months.reduce((a, mo) => a + (mo.savings || 0), 0);
  return (data.baseAmount || 0) + fromMonths;
}

/** BUG FIX: baseAmount is savings, NOT income — excluded from earned */
export function calcTotalEarned(data: UserGoalData): number {
  let total = 0;
  for (const mo of data.months) {
    total += mo.salary || 0;
    for (const e of mo.extras) total += e.value;
  }
  return total;
}

export function calcTotalSpent(data: UserGoalData): number {
  let total = 0;
  for (const mo of data.months) {
    for (const e of mo.expenses) total += e.value;
  }
  return total;
}

export function calcAvgMonthlySavings(data: UserGoalData): number {
  const savingMonths = data.months.filter((mo) => mo.savings > 0);
  if (savingMonths.length === 0) return 0;
  return savingMonths.reduce((a, mo) => a + mo.savings, 0) / savingMonths.length;
}

export type Projection =
  | { done: true }
  | { done: false; months: null }
  | { done: false; months: number; date: Date; avg: number };

export function calcProjection(data: UserGoalData): Projection {
  const totalSaved = calcTotalSaved(data);
  const remaining = data.goal - totalSaved;
  if (remaining <= 0) return { done: true };

  const avg = calcAvgMonthlySavings(data);
  if (avg <= 0) return { done: false, months: null };

  const months = Math.ceil(remaining / avg);
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return { done: false, months, date, avg };
}

export function calcAvgSalary(data: UserGoalData): number {
  const salaryMonths = data.months.filter((mo) => mo.salary > 0);
  if (salaryMonths.length === 0) return 0;
  return salaryMonths.reduce((a, mo) => a + mo.salary, 0) / salaryMonths.length;
}

export function calcSavingsRate(avgSavings: number, avgSalary: number): number {
  if (avgSalary <= 0) return 0;
  return (avgSavings / avgSalary) * 100;
}
