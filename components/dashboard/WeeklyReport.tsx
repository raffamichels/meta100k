// WeeklyReport.tsx
// Exibido toda segunda-feira das 06:00 às 23:59 (GMT-3).
// O servidor gera o texto via Claude API e cacheia no banco.

import { Suspense } from "react";
import { getOrGenerateWeeklyReport } from "@/lib/actions/weeklyReport";
import { WeeklyReportCard, WeeklyReportSkeleton } from "./WeeklyReportCard";

export interface WeeklyReportStats {
  totalSaved: number;
  goal: number;
  streak: number;
  userName: string | null;
  weekStart: string;
  weekEnd: string;
}

async function WeeklyReportFetcher(stats: WeeklyReportStats) {
  const result = await getOrGenerateWeeklyReport();

  if ("error" in result) {
    return (
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "18px 20px",
          marginBottom: 16,
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        {result.error}
      </div>
    );
  }

  return <WeeklyReportCard content={result.content} {...stats} />;
}

export function WeeklyReport(stats: WeeklyReportStats) {
  return (
    <Suspense fallback={<WeeklyReportSkeleton />}>
      <WeeklyReportFetcher {...stats} />
    </Suspense>
  );
}
