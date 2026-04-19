import { Suspense } from "react";
import { getOperativeData } from "@/lib/operative-queries";
import { DateSelector } from "@/components/operativa/date-selector";
import { StatusCounters } from "@/components/operativa/status-counters";
import { OperativeBoard } from "@/components/operativa/operative-board";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function OperativaPage({ searchParams }: Props) {
  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0] ?? "";
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? params.date
    : today;

  const { items, summary } = await getOperativeData(date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Operativa del día</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Gestiona recogidas, tránsitos y entregas
          </p>
        </div>
        <Suspense fallback={null}>
          <DateSelector currentDate={date} />
        </Suspense>
      </div>

      {/* KPI Counters */}
      <StatusCounters summary={summary} />

      {/* Operative Board */}
      <OperativeBoard items={items} />
    </div>
  );
}
